import { useEffect, useState } from "react";
import { auth, activities, schools, tasks, supervisions, getStatistics } from "@/lib/database";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Download, Calendar, BarChart3, TrendingUp, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportData {
  totalActivities: number;
  totalSupervisions: number;
  totalSchools: number;
  totalTasks: number;
  activitiesByMonth: { [key: string]: number };
  activitiesByCategory: { [key: string]: number };
  schoolsWithActivities: number;
}

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalActivities: 0,
    totalSupervisions: 0,
    totalSchools: 0,
    totalTasks: 0,
    activitiesByMonth: {},
    activitiesByCategory: {},
    schoolsWithActivities: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { user } = await auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let startDate: string, endDate: string;
      
      if (reportType === 'monthly') {
        startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      } else {
        startDate = new Date(selectedYear, 0, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, 11, 31).toISOString().split('T')[0];
      }

      // Fetch data satu per satu - jangan throw jika salah satu gagal
      let allActivities: any[] = [];
      let allSupervisions: any[] = [];
      let allSchools: any[] = [];
      let allTasks: any[] = [];

      try {
        const res = await activities.getAll(user.id);
        allActivities = res.data || [];
      } catch (e) { console.warn("Activities fetch failed:", e); }

      try {
        const res = await supervisions.getAll(user.id);
        allSupervisions = res.data || [];
      } catch (e) { console.warn("Supervisions fetch failed:", e); }

      try {
        const res = await schools.getAll(user.id);
        allSchools = res.data || [];
      } catch (e) { console.warn("Schools fetch failed:", e); }

      try {
        const res = await tasks.getAll(user.id);
        allTasks = res.data || [];
      } catch (e) { console.warn("Tasks fetch failed:", e); }

      // Filter by date range
      const filteredActivities = allActivities.filter(a => 
        a.date >= startDate && a.date <= endDate
      );
      const filteredSupervisions = allSupervisions.filter(s => 
        s.date >= startDate && s.date <= endDate
      );
      const filteredTasks = allTasks.filter(t => 
        t.date >= startDate && t.date <= endDate
      );

      // Process data
      const activitiesByMonth: { [key: string]: number } = {};
      const activitiesByCategory: { [key: string]: number } = {};
      const schoolsWithActivitiesSet = new Set<string>();

      filteredActivities.forEach((activity: any) => {
        const month = new Date(activity.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        activitiesByMonth[month] = (activitiesByMonth[month] || 0) + 1;
        activitiesByCategory[activity.category] = (activitiesByCategory[activity.category] || 0) + 1;
        if (activity.school_id) schoolsWithActivitiesSet.add(activity.school_id);
      });

      filteredSupervisions.forEach((supervision: any) => {
        const month = new Date(supervision.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        activitiesByMonth[month] = (activitiesByMonth[month] || 0) + 1;
        activitiesByCategory['Supervisi'] = (activitiesByCategory['Supervisi'] || 0) + 1;
        if (supervision.school_id) schoolsWithActivitiesSet.add(supervision.school_id);
      });

      filteredTasks.forEach((task: any) => {
        const month = new Date(task.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        activitiesByMonth[month] = (activitiesByMonth[month] || 0) + 1;
        activitiesByCategory['Tugas Tambahan'] = (activitiesByCategory['Tugas Tambahan'] || 0) + 1;
      });

      setReportData({
        totalActivities: filteredActivities.length,
        totalSupervisions: filteredSupervisions.length,
        totalSchools: allSchools.length,
        totalTasks: filteredTasks.length,
        activitiesByMonth,
        activitiesByCategory,
        schoolsWithActivities: schoolsWithActivitiesSet.size,
      });

    } catch (error: any) {
      console.error("Report fetch error:", error);
      toast.error("Gagal memuat data laporan: " + (error.message || 'Coba refresh halaman'));
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const { user } = await auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        return;
      }

      toast.info("Sedang menyiapkan laporan...");

      const periodText = reportType === 'monthly' 
        ? `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
        : `Tahun ${selectedYear}`;

      let startDate: string, endDate: string;
      if (reportType === 'monthly') {
        startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      } else {
        startDate = new Date(selectedYear, 0, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, 11, 31).toISOString().split('T')[0];
      }

      // Fetch data satu per satu untuk menghindari error
      let allActivities: any[] = [];
      let allSupervisions: any[] = [];
      let allSchools: any[] = [];
      let allTasks: any[] = [];

      try {
        const res = await activities.getAll(user.id);
        allActivities = res.data || [];
      } catch (e) { console.warn("Activities fetch failed:", e); }

      try {
        const res = await supervisions.getAll(user.id);
        allSupervisions = res.data || [];
      } catch (e) { console.warn("Supervisions fetch failed:", e); }

      try {
        const res = await schools.getAll(user.id);
        allSchools = res.data || [];
      } catch (e) { console.warn("Schools fetch failed:", e); }

      try {
        const res = await tasks.getAll(user.id);
        allTasks = res.data || [];
      } catch (e) { console.warn("Tasks fetch failed:", e); }

      // Filter by date range
      const filteredActivities = allActivities.filter(a => a.date >= startDate && a.date <= endDate);
      const filteredSupervisions = allSupervisions.filter(s => s.date >= startDate && s.date <= endDate);
      const filteredTasks = allTasks.filter(t => t.date >= startDate && t.date <= endDate);

      // Collect photos (max 6)
      const allPhotos: string[] = [];
      [...filteredActivities, ...filteredSupervisions, ...filteredTasks].forEach((item: any) => {
        if (item.photo_url_1 && allPhotos.length < 6) allPhotos.push(item.photo_url_1);
        if (item.photo_url_2 && allPhotos.length < 6) allPhotos.push(item.photo_url_2);
      });

      // Helper function to escape HTML
      const esc = (str: any) => String(str || '-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

      // Build table rows
      let tableRows = '';
      let rowNum = 1;

      filteredActivities.forEach((activity: any) => {
        const school = allSchools.find((s: any) => s.id === activity.school_id);
        tableRows += `<tr>
          <td style="text-align:center">${rowNum++}</td>
          <td>${new Date(activity.date).toLocaleDateString('id-ID')}</td>
          <td>${esc(activity.activity_name)}</td>
          <td>${esc(activity.category)}</td>
          <td>${school ? esc(school.name) : 'Tidak ada sekolah'}</td>
          <td>${esc(activity.notes)}</td>
        </tr>`;
      });

      filteredSupervisions.forEach((supervision: any) => {
        const school = allSchools.find((s: any) => s.id === supervision.school_id);
        tableRows += `<tr>
          <td style="text-align:center">${rowNum++}</td>
          <td>${new Date(supervision.date).toLocaleDateString('id-ID')}</td>
          <td>${esc(supervision.title)}</td>
          <td>Supervisi</td>
          <td>${school ? esc(school.name) : 'Tidak ada sekolah'}</td>
          <td>${esc(supervision.notes)}</td>
        </tr>`;
      });

      filteredTasks.forEach((task: any) => {
        tableRows += `<tr>
          <td style="text-align:center">${rowNum++}</td>
          <td>${new Date(task.date).toLocaleDateString('id-ID')}</td>
          <td>${esc(task.activity_name)}</td>
          <td>Tugas Tambahan</td>
          <td>${esc(task.location)}</td>
          <td>${esc(task.description)}</td>
        </tr>`;
      });

      if (tableRows === '') {
        tableRows = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#666;">Tidak ada data kegiatan pada periode ini</td></tr>`;
      }

      // Build photo section
      const photoSection = allPhotos.length > 0 ? `
        <div class="section">
          <h3 style="color:#007bff;margin-bottom:15px;">BUKTI KEGIATAN (DOKUMENTASI FOTO)</h3>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${allPhotos.map((photo, i) => `
              <div style="text-align:center;">
                <img src="${photo}" alt="Foto ${i+1}" style="max-width:100%;max-height:120px;border:1px solid #ddd;border-radius:5px;" />
                <div style="font-size:10px;color:#666;margin-top:4px;">Foto ${i+1}</div>
              </div>
            `).join('')}
          </div>
        </div>` : '';

      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // Logo URL - dari folder public
      const logoUrl = `${window.location.origin}/logo-cadisdik-xi.png`;

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laporan - ${periodText}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; font-size: 12px; color: #333; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #007bff; padding-bottom: 15px; }
    .header-inner { display: flex; align-items: center; justify-content: center; gap: 20px; }
    .header-logo { width: 80px; height: 80px; object-fit: contain; }
    .header-text { text-align: center; }
    .section { margin-bottom: 20px; }
    .blue-line { height: 2px; background: #007bff; margin: 15px 0; }
    .identity-table td { padding: 5px 8px; vertical-align: top; }
    .stats-box { background: #f0f7ff; border: 2px solid #007bff; border-radius: 8px; padding: 15px; text-align: center; display: inline-block; margin: 10px auto; }
    .stats-item { display: inline-block; margin: 5px 15px; text-align: center; }
    .stats-number { font-size: 2em; font-weight: bold; color: #007bff; display: block; }
    .stats-label { font-size: 0.85em; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 11px; vertical-align: top; }
    th { background: #007bff; color: white; text-align: center; }
    .signature { margin-top: 40px; text-align: right; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
    @media print { body { margin: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-inner">
      <img src="${logoUrl}" class="header-logo" alt="Logo Cadisdik XI" />
      <div class="header-text">
        <h1 style="margin:0;font-size:16px;color:#007bff;">LAPORAN AKTIVITAS PENGAWAS SEKOLAH</h1>
        <h2 style="margin:4px 0;font-size:14px;">Dinas Pendidikan Provinsi Jawa Barat</h2>
        <h3 style="margin:4px 0;font-size:13px;">Cabang Dinas Pendidikan Wilayah XI</h3>
        <p style="margin:8px 0;font-size:13px;"><strong>Periode: ${periodText}</strong></p>
      </div>
      <img src="${logoUrl}" class="header-logo" alt="Logo Cadisdik XI" />
    </div>
  </div>

  <div class="section">
    <h3 style="color:#007bff;margin-bottom:10px;">IDENTITAS PENGAWAS</h3>
    <table class="identity-table" style="border:none;">
      <tr><td style="width:180px;border:none;"><strong>Nama Pengawas</strong></td><td style="border:none;">: ${esc(user.full_name || user.email)}</td></tr>
      <tr><td style="border:none;"><strong>NIP</strong></td><td style="border:none;">: ${esc(user.nip)}</td></tr>
      <tr><td style="border:none;"><strong>Pangkat/Golongan</strong></td><td style="border:none;">: ${esc(user.pangkat)}</td></tr>
      <tr><td style="border:none;"><strong>Jabatan</strong></td><td style="border:none;">: ${esc(user.position || 'Pengawas Sekolah')}</td></tr>
      <tr><td style="border:none;"><strong>Unit Kerja</strong></td><td style="border:none;">: ${esc(user.unit_kerja || 'Dinas Pendidikan Provinsi Jawa Barat')}</td></tr>
    </table>
  </div>

  <div class="blue-line"></div>

  <div class="section" style="text-align:center;">
    <h3 style="color:#007bff;margin-bottom:10px;">STATISTIK KEGIATAN</h3>
    <div class="stats-box">
      <div class="stats-item"><span class="stats-number">${filteredActivities.length}</span><div class="stats-label">Aktivitas</div></div>
      <div class="stats-item"><span class="stats-number">${filteredSupervisions.length}</span><div class="stats-label">Supervisi</div></div>
      <div class="stats-item"><span class="stats-number">${filteredTasks.length}</span><div class="stats-label">Tugas Tambahan</div></div>
      <div class="stats-item"><span class="stats-number">${filteredActivities.length + filteredSupervisions.length + filteredTasks.length}</span><div class="stats-label">Total Kegiatan</div></div>
    </div>
  </div>

  <div class="blue-line"></div>

  <div class="section">
    <h3 style="color:#007bff;margin-bottom:10px;">RINGKASAN KEGIATAN</h3>
    <table>
      <thead>
        <tr>
          <th style="width:4%">No</th>
          <th style="width:11%">Tanggal</th>
          <th style="width:24%">Nama Kegiatan</th>
          <th style="width:14%">Kategori</th>
          <th style="width:20%">Sekolah/Tempat</th>
          <th style="width:27%">Catatan</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  ${photoSection}

  <div class="signature">
    <p>Garut, ${today}</p>
    <p>Pengawas Sekolah,</p>
    <br><br><br>
    <p><strong>${esc(user.full_name || user.email)}</strong></p>
    <p>NIP. ${esc(user.nip)}</p>
  </div>

  <div class="footer">
    <p>designed by @w.yogaswara ps smk kcdxi 2025</p>
  </div>
</body>
</html>`;

      // Buat blob dan buka di tab baru (lebih reliable dari window.open langsung)
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (!printWindow) {
        // Jika popup diblokir, download sebagai file HTML
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan-${periodText.replace(/\s/g, '-')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Laporan berhasil diunduh! Buka file HTML untuk mencetak.");
      } else {
        // Tunggu sebentar lalu print
        setTimeout(() => {
          printWindow.print();
          URL.revokeObjectURL(url);
        }, 1000);
        toast.success("Laporan berhasil dibuat!");
      }

    } catch (error: any) {
      console.error("Generate report error:", error);
      toast.error(`Gagal membuat laporan: ${error.message || 'Terjadi kesalahan'}`);
    }
  };

  const printReport = () => {
    generateReport(); // Use the same comprehensive report for printing
  };

  const statCards = [
    {
      title: "Total Aktivitas",
      value: reportData.totalActivities,
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Supervisi",
      value: reportData.totalSupervisions,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Sekolah Didampingi",
      value: `${reportData.schoolsWithActivities}/${reportData.totalSchools}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Tugas Tambahan",
      value: reportData.totalTasks,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
              <p className="text-muted-foreground mt-1">
                Analisis dan laporan kegiatan pengawasan
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Unduh Laporan
              </Button>
              <Button onClick={printReport} disabled={loading} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Cetak
              </Button>
            </div>
          </div>

          {/* Report Type and Period Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pengaturan Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Jenis Laporan</Label>
                  <Select value={reportType} onValueChange={(value: 'monthly' | 'yearly') => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Laporan Bulanan</SelectItem>
                      <SelectItem value="yearly">Laporan Tahunan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {reportType === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="month">Bulan</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(2024, i).toLocaleDateString('id-ID', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="year">Tahun</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas per Bulan</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(reportData.activitiesByMonth).length === 0 ? (
                <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(reportData.activitiesByMonth)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([month, count]) => (
                      <div key={month} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                        <span className="font-medium">{month}</span>
                        <Badge variant="secondary">{count} kegiatan</Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(reportData.activitiesByCategory).length === 0 ? (
                <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(reportData.activitiesByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <span className="font-medium">{category}</span>
                      <Badge variant="outline">{count} kegiatan</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>designed by @w.yogaswara ps smk kcdxi 2025</p>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Reports;
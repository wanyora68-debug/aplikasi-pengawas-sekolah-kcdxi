import { useEffect, useState } from "react";
import { auth, getData, Activity, School, Task } from "@/lib/database";
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
      if (!user) return;

      let startDate: string, endDate: string;
      
      if (reportType === 'monthly') {
        startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      } else {
        startDate = new Date(selectedYear, 0, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, 11, 31).toISOString().split('T')[0];
      }

      // Fetch data from localStorage
      const allActivities = getData<Activity>('activities').filter(a => a.user_id === user.id);
      const allSchools = getData<School>('schools').filter(s => s.user_id === user.id);
      const allTasks = getData<Task>('tasks').filter(t => t.user_id === user.id);

      // Filter by date range
      const activities = allActivities.filter(a => 
        a.date >= startDate && a.date <= endDate && a.category !== "Supervisi"
      );
      
      const supervisions = allActivities.filter(a => 
        a.date >= startDate && a.date <= endDate && a.category === "Supervisi"
      );

      const tasks = allTasks.filter(t => 
        t.date >= startDate && t.date <= endDate
      );

      // Process data
      const activitiesByMonth: { [key: string]: number } = {};
      const activitiesByCategory: { [key: string]: number } = {};
      const schoolsWithActivitiesSet = new Set();

      [...activities, ...supervisions].forEach((activity) => {
        const month = new Date(activity.date).toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'long' 
        });
        activitiesByMonth[month] = (activitiesByMonth[month] || 0) + 1;
        activitiesByCategory[activity.category] = (activitiesByCategory[activity.category] || 0) + 1;
        
        if (activity.school_id) {
          schoolsWithActivitiesSet.add(activity.school_id);
        }
      });

      setReportData({
        totalActivities: activities.length,
        totalSupervisions: supervisions.length,
        totalSchools: allSchools.length,
        totalTasks: tasks.length,
        activitiesByMonth,
        activitiesByCategory,
        schoolsWithActivities: schoolsWithActivitiesSet.size,
      });

    } catch (error: any) {
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const { user } = await auth.getUser();
      if (!user) return;

      const periodText = reportType === 'monthly' 
        ? `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
        : `Tahun ${selectedYear}`;

      // Get all activities with photos for the period
      let startDate, endDate;
      if (reportType === 'monthly') {
        startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      } else {
        startDate = new Date(selectedYear, 0, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, 11, 31).toISOString().split('T')[0];
      }

      const allActivities = getData<Activity>('activities').filter(a => a.user_id === user.id);
      const allSchools = getData<School>('schools').filter(s => s.user_id === user.id);
      const allTasks = getData<Task>('tasks').filter(t => t.user_id === user.id);

      const activities = allActivities.filter(a => 
        a.date >= startDate && a.date <= endDate
      );

      const tasks = allTasks.filter(t => 
        t.date >= startDate && t.date <= endDate
      );

      // Get all photos from activities and tasks
      const allPhotos = [];
      activities.forEach(activity => {
        if (activity.photo_url_1) allPhotos.push(activity.photo_url_1);
        if (activity.photo_url_2) allPhotos.push(activity.photo_url_2);
      });
      tasks.forEach(task => {
        if (task.photo_url_1) allPhotos.push(task.photo_url_1);
        if (task.photo_url_2) allPhotos.push(task.photo_url_2);
      });

      // Create comprehensive PDF-style report sesuai format yang diminta
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Laporan Aktivitas Pengawas Sekolah - ${periodText}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                  line-height: 1.6;
                  font-size: 12px;
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 3px solid #007bff;
                  padding-bottom: 20px;
                }
                .section { 
                  margin-bottom: 25px; 
                  page-break-inside: avoid;
                }
                .label { 
                  font-weight: bold; 
                  color: #333;
                  display: inline-block;
                  width: 200px;
                }
                .identity-table {
                  width: 100%;
                  margin: 20px 0;
                }
                .identity-table td {
                  padding: 8px;
                  border: none;
                  vertical-align: top;
                }
                .stats-container {
                  display: flex;
                  justify-content: center;
                  margin: 30px 0;
                }
                .stats-box {
                  background-color: #f8f9fa;
                  border: 2px solid #007bff;
                  border-radius: 10px;
                  padding: 20px;
                  text-align: center;
                  display: inline-block;
                }
                .stats-item {
                  display: inline-block;
                  margin: 10px 20px;
                  text-align: center;
                }
                .stats-number {
                  font-size: 2.5em;
                  font-weight: bold;
                  color: #007bff;
                  display: block;
                }
                .stats-label {
                  font-size: 0.9em;
                  color: #666;
                  margin-top: 5px;
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-top: 15px; 
                }
                th, td { 
                  border: 1px solid #ddd; 
                  padding: 8px; 
                  text-align: left; 
                  vertical-align: top;
                  font-size: 11px;
                }
                th { 
                  background-color: #007bff; 
                  color: white;
                  font-weight: bold;
                  text-align: center;
                }
                .photo-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                  gap: 10px;
                  margin-top: 20px;
                }
                .photo-item {
                  text-align: center;
                }
                .photo-item img {
                  max-width: 150px;
                  max-height: 100px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                }
                .photo-caption {
                  font-size: 10px;
                  color: #666;
                  margin-top: 5px;
                }
                .signature-section {
                  margin-top: 50px;
                  text-align: right;
                }
                .blue-line {
                  height: 3px;
                  background-color: #007bff;
                  margin: 20px 0;
                }
                @media print {
                  .page-break { page-break-before: always; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0; font-size: 18px; color: #007bff;">LAPORAN AKTIVITAS PENGAWAS SEKOLAH</h1>
                <h2 style="margin: 5px 0; font-size: 16px;">Dinas Pendidikan Provinsi Jawa Barat</h2>
                <h3 style="margin: 5px 0; font-size: 14px;">Cabang Dinas Pendidikan Wilayah XI</h3>
                <p style="margin: 10px 0; font-size: 14px;"><strong>Periode: ${periodText}</strong></p>
              </div>
              
              <div class="blue-line"></div>
              
              <div class="section">
                <h3 style="color: #007bff; margin-bottom: 15px;">IDENTITAS PENGAWAS</h3>
                <table class="identity-table">
                  <tr>
                    <td><span class="label">Nama Pengawas</span></td>
                    <td>: ${user.full_name || user.email}</td>
                  </tr>
                  <tr>
                    <td><span class="label">NIP</span></td>
                    <td>: ${user.nip || '-'}</td>
                  </tr>
                  <tr>
                    <td><span class="label">Pangkat/Golongan</span></td>
                    <td>: ${user.pangkat || '-'}</td>
                  </tr>
                  <tr>
                    <td><span class="label">Jabatan</span></td>
                    <td>: ${user.position || 'Pengawas Sekolah'}</td>
                  </tr>
                  <tr>
                    <td><span class="label">Unit Kerja</span></td>
                    <td>: ${user.unit_kerja || 'Dinas Pendidikan Provinsi Jawa Barat'}</td>
                  </tr>
                </table>
              </div>

              <div class="blue-line"></div>

              <div class="section">
                <h3 style="color: #007bff; text-align: center; margin-bottom: 20px;">STATISTIK KEGIATAN</h3>
                <div class="stats-container">
                  <div class="stats-box">
                    <div class="stats-item">
                      <span class="stats-number">${activities.length}</span>
                      <div class="stats-label">Total Aktivitas</div>
                    </div>
                    <div class="stats-item">
                      <span class="stats-number">${activities.filter(a => a.category === 'Supervisi').length}</span>
                      <div class="stats-label">Supervisi</div>
                    </div>
                    <div class="stats-item">
                      <span class="stats-number">${tasks.length}</span>
                      <div class="stats-label">Tugas Tambahan</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="blue-line"></div>

              <div class="section">
                <h3 style="color: #007bff; margin-bottom: 15px;">RINGKASAN KEGIATAN</h3>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 5%;">No</th>
                      <th style="width: 12%;">Tanggal</th>
                      <th style="width: 25%;">Nama Kegiatan</th>
                      <th style="width: 15%;">Kategori</th>
                      <th style="width: 20%;">Sekolah/Tempat</th>
                      <th style="width: 23%;">Hasil/Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activities.map((activity, index) => {
                      const school = allSchools.find(s => s.id === activity.school_id);
                      return `
                        <tr>
                          <td style="text-align: center;">${index + 1}</td>
                          <td>${new Date(activity.date).toLocaleDateString('id-ID')}</td>
                          <td>${activity.activity_name}</td>
                          <td>${activity.category}</td>
                          <td>${school ? school.name : 'Tidak ada sekolah'}</td>
                          <td>${activity.notes || '-'}</td>
                        </tr>
                      `;
                    }).join('')}
                    ${tasks.map((task, index) => `
                      <tr>
                        <td style="text-align: center;">${activities.length + index + 1}</td>
                        <td>${new Date(task.date).toLocaleDateString('id-ID')}</td>
                        <td>${task.activity_name}</td>
                        <td>Tugas Tambahan</td>
                        <td>${task.location}</td>
                        <td>${task.description}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              ${allPhotos.length > 0 ? `
                <div class="section page-break">
                  <h3 style="color: #007bff; margin-bottom: 15px;">BUKTI KEGIATAN (DOKUMENTASI FOTO)</h3>
                  <div class="photo-grid">
                    ${allPhotos.slice(0, 12).map((photo, index) => `
                      <div class="photo-item">
                        <img src="${photo}" alt="Foto ${index + 1}" />
                        <div class="photo-caption">Foto Kegiatan ${index + 1}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="signature-section">
                <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Pengawas Sekolah,</p>
                <br><br><br>
                <p><strong>${user.full_name || user.email}</strong></p>
                <p>NIP. ${user.nip || '-'}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      toast.success("Laporan berhasil dibuat!");
    } catch (error: any) {
      toast.error("Gagal membuat laporan");
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
import { useEffect, useState } from "react";
import { auth } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Download, Calendar, BarChart3, TrendingUp, Printer, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportData {
  periodActivities: number;
  periodSupervisions: number;
  periodTasks: number;
  periodAll: number;
  totalSchools: number;
  schoolsWithActivities: number;
  activitiesByMonth: { [key: string]: number };
  activitiesByCategory: { [key: string]: number };
}

// Cache data untuk cetak cepat
let dataCache: {
  user: any;
  acts: any[];
  sups: any[];
  tsks: any[];
  schs: any[];
} | null = null;

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData>({
    periodActivities: 0,
    periodSupervisions: 0,
    periodTasks: 0,
    periodAll: 0,
    totalSchools: 0,
    schoolsWithActivities: 0,
    activitiesByMonth: {},
    activitiesByCategory: {},
  });

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    dataCache = null;
    fetchReportData();
  }, [reportType, selectedMonth, selectedYear]);

  const getDateRange = () => {
    if (reportType === 'monthly') {
      return {
        startDate: new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0],
        endDate: new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0],
      };
    }
    return {
      startDate: `${selectedYear}-01-01`,
      endDate: `${selectedYear}-12-31`,
    };
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { user } = await auth.getUser();
      if (!user) { setLoading(false); return; }

      const { startDate, endDate } = getDateRange();

      // Query langsung ke Supabase dengan filter tanggal di server
      const [actResult, supResult, schResult, taskResult] = await Promise.all([
        supabase.from('activities').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
        supabase.from('supervisions').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
        supabase.from('schools').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
      ]);

      const acts = actResult.data || [];
      const sups = supResult.data || [];
      const schs = schResult.data || [];
      const tsks = taskResult.data || [];

      // Simpan ke cache untuk cetak
      dataCache = { user, acts, sups, tsks, schs };

      // Hitung statistik
      const activitiesByMonth: { [key: string]: number } = {};
      const activitiesByCategory: { [key: string]: number } = {};
      const schoolsSet = new Set<string>();

      acts.forEach((a: any) => {
        const m = new Date(a.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        activitiesByMonth[m] = (activitiesByMonth[m] || 0) + 1;
        activitiesByCategory['Aktivitas'] = (activitiesByCategory['Aktivitas'] || 0) + 1;
        if (a.school_id) schoolsSet.add(a.school_id);
      });

      sups.forEach((s: any) => {
        const m = new Date(s.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        activitiesByMonth[m] = (activitiesByMonth[m] || 0) + 1;
        activitiesByCategory['Supervisi'] = (activitiesByCategory['Supervisi'] || 0) + 1;
        if (s.school_id) schoolsSet.add(s.school_id);
      });

      tsks.forEach((t: any) => {
        const m = new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        activitiesByMonth[m] = (activitiesByMonth[m] || 0) + 1;
        activitiesByCategory['Tugas Tambahan'] = (activitiesByCategory['Tugas Tambahan'] || 0) + 1;
      });

      setReportData({
        periodActivities: acts.length,
        periodSupervisions: sups.length,
        periodTasks: tsks.length,
        periodAll: acts.length + sups.length + tsks.length,
        totalSchools: schs.length,
        schoolsWithActivities: schoolsSet.size,
        activitiesByMonth,
        activitiesByCategory,
      });

    } catch (error: any) {
      toast.error("Gagal memuat data: " + (error.message || 'Coba refresh halaman'));
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      let user: any, acts: any[], sups: any[], tsks: any[], schs: any[];

      if (dataCache) {
        ({ user, acts, sups, tsks, schs } = dataCache);
      } else {
        const { user: u } = await auth.getUser();
        if (!u) { setGenerating(false); return; }
        user = u;
        const { startDate, endDate } = getDateRange();
        const [ar, sr, scr, tr] = await Promise.all([
          supabase.from('activities').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
          supabase.from('supervisions').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
          supabase.from('schools').select('*').eq('user_id', user.id),
          supabase.from('tasks').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
        ]);
        acts = ar.data || [];
        sups = sr.data || [];
        schs = scr.data || [];
        tsks = tr.data || [];
      }

      const periodText = reportType === 'monthly'
        ? new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        : `Tahun ${selectedYear}`;

      const esc = (v: any) => String(v || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const logoUrl = `${window.location.origin}/logo-cadisdik-xi.png`;
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      const photos: string[] = [];
      [...acts, ...sups, ...tsks].forEach((item: any) => {
        if (item.photo_url_1 && photos.length < 6) photos.push(item.photo_url_1);
        if (item.photo_url_2 && photos.length < 6) photos.push(item.photo_url_2);
      });

      let rows = '';
      let n = 1;
      acts.forEach((a: any) => {
        const sc = schs.find((s: any) => s.id === a.school_id);
        rows += `<tr><td style="text-align:center">${n++}</td><td>${new Date(a.date).toLocaleDateString('id-ID')}</td><td>${esc(a.activity_name)}</td><td>${esc(a.category)}</td><td>${sc ? esc(sc.name) : '-'}</td><td>${esc(a.notes)}</td></tr>`;
      });
      sups.forEach((s: any) => {
        const sc = schs.find((sc: any) => sc.id === s.school_id);
        rows += `<tr><td style="text-align:center">${n++}</td><td>${new Date(s.date).toLocaleDateString('id-ID')}</td><td>${esc(s.title)}</td><td>Supervisi</td><td>${sc ? esc(sc.name) : '-'}</td><td>${esc(s.notes)}</td></tr>`;
      });
      tsks.forEach((t: any) => {
        rows += `<tr><td style="text-align:center">${n++}</td><td>${new Date(t.date).toLocaleDateString('id-ID')}</td><td>${esc(t.activity_name)}</td><td>Tugas Tambahan</td><td>${esc(t.location)}</td><td>${esc(t.description)}</td></tr>`;
      });
      if (!rows) rows = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#666">Tidak ada data kegiatan pada periode ini</td></tr>`;

      const photoHtml = photos.length > 0 ? `<div style="margin-bottom:15px"><h3 style="color:#007bff;margin-bottom:8px">BUKTI KEGIATAN</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${photos.map((p, i) => `<div style="text-align:center"><img src="${p}" style="max-width:100%;max-height:110px;border:1px solid #ddd;border-radius:4px"/><div style="font-size:10px;color:#666;margin-top:3px">Foto ${i + 1}</div></div>`).join('')}</div></div>` : '';

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan ${periodText}</title>
<style>body{font-family:Arial,sans-serif;margin:15px;line-height:1.5;font-size:12px;color:#333}.hdr{display:flex;align-items:center;justify-content:center;gap:15px;border-bottom:3px solid #007bff;padding-bottom:12px;margin-bottom:12px}.logo{width:65px;height:65px;object-fit:contain}.bl{height:2px;background:#007bff;margin:10px 0}.sb{background:#f0f7ff;border:2px solid #007bff;border-radius:8px;padding:10px;text-align:center;display:inline-block}.si{display:inline-block;margin:4px 10px;text-align:center}.sn{font-size:1.7em;font-weight:bold;color:#007bff;display:block}.sl{font-size:0.8em;color:#555}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ccc;padding:5px 6px;font-size:11px;vertical-align:top}th{background:#007bff;color:white;text-align:center}.sig{margin-top:30px;text-align:right}.ft{margin-top:15px;text-align:center;font-size:10px;color:#999}@media print{body{margin:8px}}</style>
</head><body>
<div class="hdr">
  <img src="${logoUrl}" class="logo" alt="Logo"/>
  <div style="text-align:center">
    <h1 style="margin:0;font-size:14px;color:#007bff">LAPORAN AKTIVITAS PENGAWAS SEKOLAH</h1>
    <h2 style="margin:3px 0;font-size:13px">Dinas Pendidikan Provinsi Jawa Barat</h2>
    <h3 style="margin:3px 0;font-size:12px">Cabang Dinas Pendidikan Wilayah XI</h3>
    <p style="margin:5px 0;font-size:12px"><strong>Periode: ${periodText}</strong></p>
  </div>
  <img src="${logoUrl}" class="logo" alt="Logo"/>
</div>
<div style="margin-bottom:12px">
  <h3 style="color:#007bff;margin-bottom:6px">IDENTITAS PENGAWAS</h3>
  <table style="border:none">
    <tr><td style="width:150px;border:none"><strong>Nama Pengawas</strong></td><td style="border:none">: ${esc(user.full_name || user.email)}</td></tr>
    <tr><td style="border:none"><strong>NIP</strong></td><td style="border:none">: ${esc(user.nip)}</td></tr>
    <tr><td style="border:none"><strong>Pangkat/Golongan</strong></td><td style="border:none">: ${esc(user.pangkat)}</td></tr>
    <tr><td style="border:none"><strong>Jabatan</strong></td><td style="border:none">: ${esc(user.position || 'Pengawas Sekolah')}</td></tr>
    <tr><td style="border:none"><strong>Unit Kerja</strong></td><td style="border:none">: ${esc(user.unit_kerja || 'Dinas Pendidikan Provinsi Jawa Barat')}</td></tr>
  </table>
</div>
<div class="bl"></div>
<div style="text-align:center;margin-bottom:12px">
  <h3 style="color:#007bff;margin-bottom:8px">STATISTIK KEGIATAN</h3>
  <div class="sb">
    <div class="si"><span class="sn">${acts.length}</span><div class="sl">Aktivitas</div></div>
    <div class="si"><span class="sn">${sups.length}</span><div class="sl">Supervisi</div></div>
    <div class="si"><span class="sn">${tsks.length}</span><div class="sl">Tugas Tambahan</div></div>
    <div class="si"><span class="sn">${acts.length + sups.length + tsks.length}</span><div class="sl">Total</div></div>
  </div>
</div>
<div class="bl"></div>
<div style="margin-bottom:12px">
  <h3 style="color:#007bff;margin-bottom:6px">RINGKASAN KEGIATAN</h3>
  <table><thead><tr><th style="width:4%">No</th><th style="width:11%">Tanggal</th><th style="width:24%">Nama Kegiatan</th><th style="width:13%">Kategori</th><th style="width:20%">Sekolah/Tempat</th><th style="width:28%">Catatan</th></tr></thead>
  <tbody>${rows}</tbody></table>
</div>
${photoHtml}
<div class="sig"><p>Garut, ${today}</p><p>Pengawas Sekolah,</p><br><br><br><p><strong>${esc(user.full_name || user.email)}</strong></p><p>NIP. ${esc(user.nip)}</p></div>
<div class="ft"><p>designed by @w.yogaswara ps smk kcdxi 2025</p></div>
</body></html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan-${periodText.replace(/\s/g, '-')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Laporan diunduh!");
      } else {
        setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 300);
        toast.success("Laporan siap!");
      }
    } catch (error: any) {
      toast.error(`Gagal membuat laporan: ${error.message || 'Terjadi kesalahan'}`);
    } finally {
      setGenerating(false);
    }
  };

  const periodLabel = reportType === 'monthly'
    ? new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : `Tahun ${selectedYear}`;

  const statCards = [
    { title: "Total Kegiatan", value: reportData.periodAll, sub: periodLabel, icon: BarChart3, color: "text-blue-600", bgColor: "bg-blue-100" },
    { title: "Aktivitas", value: reportData.periodActivities, sub: periodLabel, icon: ClipboardList, color: "text-indigo-600", bgColor: "bg-indigo-100" },
    { title: "Supervisi", value: reportData.periodSupervisions, sub: periodLabel, icon: FileText, color: "text-green-600", bgColor: "bg-green-100" },
    { title: "Tugas Tambahan", value: reportData.periodTasks, sub: periodLabel, icon: Calendar, color: "text-orange-600", bgColor: "bg-orange-100" },
    { title: "Sekolah Dampingan", value: reportData.totalSchools, sub: `${reportData.schoolsWithActivities} aktif ${periodLabel}`, icon: TrendingUp, color: "text-purple-600", bgColor: "bg-purple-100" },
  ];

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
              <p className="text-muted-foreground mt-1">Analisis dan laporan kegiatan pengawasan</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={loading || generating}>
                <Download className="w-4 h-4 mr-2" />
                {generating ? "Menyiapkan..." : "Unduh / Cetak"}
              </Button>
              <Button onClick={generateReport} disabled={loading || generating} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Cetak
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Pengaturan Laporan</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Laporan</Label>
                  <Select value={reportType} onValueChange={(v: 'monthly' | 'yearly') => setReportType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Laporan Bulanan</SelectItem>
                      <SelectItem value="yearly">Laporan Tahunan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {reportType === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Bulan</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>Tahun</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const y = new Date().getFullYear() - i;
                        return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
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
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Aktivitas per Bulan</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(reportData.activitiesByMonth).length === 0 ? (
                <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(reportData.activitiesByMonth).map(([month, count]) => (
                    <div key={month} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <span className="font-medium">{month}</span>
                      <Badge variant="secondary">{count} kegiatan</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Aktivitas per Kategori</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(reportData.activitiesByCategory).length === 0 ? (
                <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
              ) : (
                <div className="space-y-2">
                  {['Aktivitas', 'Supervisi', 'Tugas Tambahan'].map((cat) => {
                    const count = reportData.activitiesByCategory[cat];
                    if (!count) return null;
                    return (
                      <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                        <span className="font-medium">{cat}</span>
                        <Badge variant="outline">{count} kegiatan</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>designed by @w.yogaswara ps smk kcdxi 2025</p>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Reports;

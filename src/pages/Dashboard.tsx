import { useEffect, useState } from "react";
import { auth, activities, supervisions, tasks, schools } from "@/lib/database";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, School, FileText, TrendingUp, User, Eye, BarChart3 } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAll: 0,
    totalActivities: 0,
    totalSupervisions: 0,
    totalTasks: 0,
    totalSchools: 0,
  });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { user } = await auth.getUser();
    if (user) setCurrentUser(user);
  };

  const fetchStats = async () => {
    const { user } = await auth.getUser();
    if (!user) return;

    console.log("=== DASHBOARD FETCH STATS ===");
    console.log("User ID:", user.id, "Email:", user.email);

    // Gunakan try/catch per fetch seperti di Reports yang sudah terbukti benar
    let totalActivities = 0;
    let totalSupervisions = 0;
    let totalTasks = 0;
    let totalSchools = 0;

    try {
      const res = await activities.getAll(user.id);
      totalActivities = res.data?.length || 0;
      console.log("Activities:", totalActivities, res.error);
    } catch (e) { console.warn("Activities fetch failed:", e); }

    try {
      const res = await supervisions.getAll(user.id);
      totalSupervisions = res.data?.length || 0;
      console.log("Supervisions:", totalSupervisions);
    } catch (e) { console.warn("Supervisions fetch failed:", e); }

    try {
      const res = await tasks.getAll(user.id);
      totalTasks = res.data?.length || 0;
      console.log("Tasks:", totalTasks);
    } catch (e) { console.warn("Tasks fetch failed:", e); }

    try {
      const res = await schools.getAll(user.id);
      totalSchools = res.data?.length || 0;
      console.log("Schools:", totalSchools);
    } catch (e) { console.warn("Schools fetch failed:", e); }

    setStats({
      totalAll: totalActivities + totalSupervisions + totalTasks,
      totalActivities,
      totalSupervisions,
      totalTasks,
      totalSchools,
    });
  };

  const statCards = [
    { title: "Total Semua Kegiatan", value: stats.totalAll, icon: BarChart3, color: "text-blue-600", bgColor: "bg-blue-100" },
    { title: "Aktivitas", value: stats.totalActivities, icon: Activity, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Supervisi", value: stats.totalSupervisions, icon: Eye, color: "text-green-600", bgColor: "bg-green-100" },
    { title: "Tugas Tambahan", value: stats.totalTasks, icon: FileText, color: "text-orange-600", bgColor: "bg-orange-100" },
    { title: "Sekolah Dampingan", value: stats.totalSchools, icon: School, color: "text-purple-600", bgColor: "bg-purple-100" },
  ];

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-8">
          {/* Welcome Section with Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {currentUser?.profile_photo ? (
                <img
                  src={currentUser.profile_photo}
                  alt="Foto Profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Selamat datang, {currentUser?.full_name || currentUser?.email || 'Pengawas'}!
              </h1>
              <p className="text-muted-foreground">
                {currentUser?.position || 'Pengawas Sekolah'} - Jurnal Pendampingan Pengawas Sekolah
              </p>
            </div>
          </div>

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
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Gunakan menu <strong>Aktivitas</strong> untuk mencatat pendampingan</p>
              <p>• Kelola daftar sekolah dampingan di menu <strong>Sekolah</strong></p>
              <p>• Catat tugas tambahan di menu <strong>Tugas Tambahan</strong></p>
              <p>• Semua data tersimpan dengan aman dan dapat diakses kapan saja</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Dashboard;

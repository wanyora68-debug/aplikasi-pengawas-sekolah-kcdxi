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

    const [actRes, supRes, taskRes, schRes] = await Promise.allSettled([
      activities.getAll(user.id),
      supervisions.getAll(user.id),
      tasks.getAll(user.id),
      schools.getAll(user.id),
    ]);

    console.log("Activities result:", actRes.status, actRes.status === 'fulfilled' ? actRes.value.data?.length : actRes.reason);
    console.log("Supervisions result:", supRes.status, supRes.status === 'fulfilled' ? supRes.value.data?.length : supRes.reason);
    console.log("Tasks result:", taskRes.status, taskRes.status === 'fulfilled' ? taskRes.value.data?.length : taskRes.reason);
    console.log("Schools result:", schRes.status, schRes.status === 'fulfilled' ? schRes.value.data?.length : schRes.reason);

    const totalActivities = actRes.status === 'fulfilled' ? actRes.value.data?.length || 0 : 0;
    const totalSupervisions = supRes.status === 'fulfilled' ? supRes.value.data?.length || 0 : 0;
    const totalTasks = taskRes.status === 'fulfilled' ? taskRes.value.data?.length || 0 : 0;
    const totalSchools = schRes.status === 'fulfilled' ? schRes.value.data?.length || 0 : 0;

    console.log("Stats:", { totalActivities, totalSupervisions, totalTasks, totalSchools });

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
    { title: "Aktivitas Pendampingan", value: stats.totalActivities, icon: Activity, color: "text-primary", bgColor: "bg-primary/10" },
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

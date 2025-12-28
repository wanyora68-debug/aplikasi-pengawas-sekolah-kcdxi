import { useEffect, useState } from "react";
import { auth, getStatistics } from "@/lib/database";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, School, FileText, TrendingUp, User } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalSchools: 0,
    totalTasks: 0,
    activitiesThisMonth: 0,
  });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { user } = await auth.getUser();
    if (user) {
      setCurrentUser(user);
    }
  };

  const fetchStats = async () => {
    const { user } = await auth.getUser();
    if (!user) return;

    const statistics = await getStatistics(user.id);
    setStats(statistics);
  };

  const statCards = [
    {
      title: "Total Aktivitas",
      value: stats.totalActivities,
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Sekolah Dampingan",
      value: stats.totalSchools,
      icon: School,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Tugas Tambahan",
      value: stats.totalTasks,
      icon: FileText,
      color: "text-accent",
      bgColor: "bg-accent",
    },
    {
      title: "Aktivitas Bulan Ini",
      value: stats.activitiesThisMonth,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
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

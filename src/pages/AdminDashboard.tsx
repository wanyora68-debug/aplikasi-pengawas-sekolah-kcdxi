import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  School, 
  ClipboardList, 
  FileText, 
  TrendingUp,
  Calendar,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  totalSchools: number;
  totalActivities: number;
  totalTasks: number;
}

interface UserSummary {
  id: string;
  full_name: string;
  email: string;
  position: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSchools: 0,
    totalActivities: 0,
    totalTasks: 0
  });
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminStats = async () => {
    try {
      // Fetch stats manually without complex functions
      const [usersRes, schoolsRes, activitiesRes, tasksRes] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'user'),
        supabase.from('schools').select('id'),
        supabase.from('activities').select('id'),
        supabase.from('tasks').select('id')
      ]);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalSchools: schoolsRes.data?.length || 0,
        totalActivities: activitiesRes.data?.length || 0,
        totalTasks: tasksRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Gagal mengambil statistik admin');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, position, created_at')
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal mengambil data pengguna');
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchAdminStats(), fetchUsers()]);
    setRefreshing(false);
    toast.success('Data berhasil diperbarui');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAdminStats(), fetchUsers()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const exportData = async () => {
    try {
      // Simple CSV export of users
      const csvContent = [
        ['Nama', 'Email', 'Posisi', 'Tanggal Daftar'],
        ...users.map(user => [
          user.full_name,
          user.email,
          user.position || 'Pengawas Sekolah',
          new Date(user.created_at).toLocaleDateString('id-ID')
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-pengawas-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Data berhasil diekspor');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Memuat data admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrator</h1>
          <p className="text-muted-foreground">
            Kelola dan pantau aktivitas pengawas sekolah
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengawas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Pengawas terdaftar di sistem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sekolah</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              Sekolah dalam binaan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aktivitas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              Aktivitas supervisi tercatat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tugas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tugas tambahan tercatat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengawas Terdaftar</CardTitle>
          <CardDescription>
            Semua pengawas yang terdaftar di sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <h4 className="font-medium">{user.full_name}</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary">
                    {user.position || 'Pengawas Sekolah'}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Terdaftar</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada pengawas terdaftar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ <strong>Hak Akses Admin:</strong> Anda dapat melihat dan mengelola semua data pengawas</p>
            <p>✅ <strong>Export Data:</strong> Download laporan dalam format CSV</p>
            <p>✅ <strong>Monitor Real-time:</strong> Statistik diperbarui secara otomatis</p>
            <p>✅ <strong>Multi-role:</strong> Admin juga dapat menggunakan fitur pengawas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
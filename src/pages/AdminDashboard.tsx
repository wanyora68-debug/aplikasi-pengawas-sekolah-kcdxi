import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  School, 
  ClipboardList, 
  FileText, 
  Eye,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Printer,
  X,
  Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";

interface AdminStats {
  totalUsers: number;
  totalSchools: number;
  totalActivities: number;
  totalSupervisions: number;
  totalTasks: number;
}

interface UserData {
  id: string;
  full_name: string;
  email: string;
  nip?: string;
  position?: string;
  pangkat?: string;
  unit_kerja?: string;
  role: string;
  created_at: string;
}

interface ActivityData {
  id: string;
  activity_name: string;
  category: string;
  date: string;
  notes?: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

interface SupervisionData {
  id: string;
  title: string;
  date: string;
  notes: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSchools: 0,
    totalActivities: 0,
    totalSupervisions: 0,
    totalTasks: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const fetchAdminStats = async () => {
    try {
      const [usersRes, schoolsRes, activitiesRes, supervisionsRes, tasksRes] = await Promise.all([
        supabase.from('users').select('id'),
        supabase.from('schools').select('id'),
        supabase.from('activities').select('id'),
        supabase.from('supervisions').select('id'),
        supabase.from('tasks').select('id')
      ]);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalSchools: schoolsRes.data?.length || 0,
        totalActivities: activitiesRes.data?.length || 0,
        totalSupervisions: supervisionsRes.data?.length || 0,
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
        .select('*')
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

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          users!activities_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      const formattedActivities = data?.map(activity => ({
        ...activity,
        user_name: activity.users?.full_name || 'Unknown User'
      })) || [];

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Gagal mengambil data aktivitas');
    }
  };

  const fetchSupervisions = async () => {
    try {
      const { data, error } = await supabase
        .from('supervisions')
        .select(`
          *,
          users!supervisions_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching supervisions:', error);
        return;
      }

      const formattedSupervisions = data?.map(supervision => ({
        ...supervision,
        user_name: supervision.users?.full_name || 'Unknown User'
      })) || [];

      setSupervisions(formattedSupervisions);
    } catch (error) {
      console.error('Error fetching supervisions:', error);
      toast.error('Gagal mengambil data supervisi');
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchAdminStats(), fetchUsers(), fetchActivities(), fetchSupervisions()]);
    setRefreshing(false);
    toast.success('Data berhasil diperbarui');
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini? Semua data terkait akan ikut terhapus.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Gagal menghapus pengguna');
        return;
      }

      toast.success('Pengguna berhasil dihapus');
      fetchUsers();
      fetchAdminStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Gagal menghapus pengguna');
    }
  };

  const updateUser = async (userData: UserData) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: userData.full_name,
          email: userData.email,
          nip: userData.nip,
          position: userData.position,
          pangkat: userData.pangkat,
          unit_kerja: userData.unit_kerja,
          role: userData.role
        })
        .eq('id', userData.id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Gagal mengupdate pengguna');
        return;
      }

      toast.success('Pengguna berhasil diupdate');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Gagal mengupdate pengguna');
    }
  };

  const deleteActivity = async (activityId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        console.error('Error deleting activity:', error);
        toast.error('Gagal menghapus aktivitas');
        return;
      }

      toast.success('Aktivitas berhasil dihapus');
      fetchActivities();
      fetchAdminStats();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Gagal menghapus aktivitas');
    }
  };

  const deleteSupervision = async (supervisionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus supervisi ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('supervisions')
        .delete()
        .eq('id', supervisionId);

      if (error) {
        console.error('Error deleting supervision:', error);
        toast.error('Gagal menghapus supervisi');
        return;
      }

      toast.success('Supervisi berhasil dihapus');
      fetchSupervisions();
      fetchAdminStats();
    } catch (error) {
      console.error('Error deleting supervision:', error);
      toast.error('Gagal menghapus supervisi');
    }
  };

  const printActivityReport = (activity: ActivityData) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Aktivitas - ${activity.activity_name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { margin-bottom: 20px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>LAPORAN AKTIVITAS PENGAWAS SEKOLAH</h2>
              <p>Cabang Dinas Pendidikan Wilayah XI</p>
            </div>
            <div class="content">
              <p><span class="label">Nama Aktivitas:</span> ${activity.activity_name}</p>
              <p><span class="label">Kategori:</span> ${activity.category}</p>
              <p><span class="label">Tanggal:</span> ${new Date(activity.date).toLocaleDateString('id-ID')}</p>
              <p><span class="label">Pengawas:</span> ${activity.user_name}</p>
              <p><span class="label">Catatan:</span></p>
              <p>${activity.notes || '-'}</p>
            </div>
            <div style="margin-top: 50px; text-align: right;">
              <p>Jakarta, ${new Date().toLocaleDateString('id-ID')}</p>
              <p>Administrator</p>
            </div>
            <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666;">
              <p>designed by @w.yogaswara ps smk kcdxi 2025</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printSupervisionReport = (supervision: SupervisionData) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Supervisi - ${supervision.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { margin-bottom: 20px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>LAPORAN SUPERVISI SEKOLAH</h2>
              <p>Cabang Dinas Pendidikan Wilayah XI</p>
            </div>
            <div class="content">
              <p><span class="label">Judul Supervisi:</span> ${supervision.title}</p>
              <p><span class="label">Tanggal:</span> ${new Date(supervision.date).toLocaleDateString('id-ID')}</p>
              <p><span class="label">Pengawas:</span> ${supervision.user_name}</p>
              <p><span class="label">Catatan:</span></p>
              <p>${supervision.notes || '-'}</p>
            </div>
            <div style="margin-top: 50px; text-align: right;">
              <p>Jakarta, ${new Date().toLocaleDateString('id-ID')}</p>
              <p>Administrator</p>
            </div>
            <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666;">
              <p>designed by @w.yogaswara ps smk kcdxi 2025</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAdminStats(), fetchUsers(), fetchActivities(), fetchSupervisions()]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Memuat data admin...</p>
            </div>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Layout>
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
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pengawas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sekolah</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSchools}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Aktivitas</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActivities}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Supervisi</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSupervisions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tugas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Kelola Pengawas</TabsTrigger>
              <TabsTrigger value="activities">Kelola Aktivitas</TabsTrigger>
              <TabsTrigger value="supervisions">Kelola Supervisi</TabsTrigger>
            </TabsList>

            {/* Users Management */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kelola Pengawas</CardTitle>
                  <CardDescription>
                    Edit dan hapus data pengawas yang terdaftar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id}>
                        {editingUser?.id === user.id ? (
                          <div className="p-4 border rounded-lg space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Nama Lengkap</Label>
                                <Input
                                  value={editingUser.full_name}
                                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input
                                  value={editingUser.email}
                                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>NIP</Label>
                                <Input
                                  value={editingUser.nip || ''}
                                  onChange={(e) => setEditingUser({...editingUser, nip: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Posisi</Label>
                                <Input
                                  value={editingUser.position || ''}
                                  onChange={(e) => setEditingUser({...editingUser, position: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Pangkat</Label>
                                <Input
                                  value={editingUser.pangkat || ''}
                                  onChange={(e) => setEditingUser({...editingUser, pangkat: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Role</Label>
                                <select
                                  value={editingUser.role}
                                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                  className="w-full px-3 py-2 border rounded-md"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => updateUser(editingUser)} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                Simpan
                              </Button>
                              <Button variant="outline" onClick={() => setEditingUser(null)} size="sm">
                                <X className="w-4 h-4 mr-2" />
                                Batal
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <h4 className="font-medium">{user.full_name}</h4>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <div className="flex gap-2">
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                  {user.role}
                                </Badge>
                                <Badge variant="outline">
                                  {user.position || 'Pengawas Sekolah'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteUser(user.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activities Management */}
            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kelola Aktivitas</CardTitle>
                  <CardDescription>
                    Lihat, cetak, dan hapus aktivitas pengawas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{activity.activity_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {activity.user_name} • {new Date(activity.date).toLocaleDateString('id-ID')}
                          </p>
                          <Badge variant="outline">{activity.category}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printActivityReport(activity)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteActivity(activity.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Supervisions Management */}
            <TabsContent value="supervisions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kelola Supervisi</CardTitle>
                  <CardDescription>
                    Lihat, cetak, dan hapus supervisi pengawas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supervisions.map((supervision) => (
                      <div key={supervision.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{supervision.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {supervision.user_name} • {new Date(supervision.date).toLocaleDateString('id-ID')}
                          </p>
                          <Badge variant="secondary">Supervisi</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printSupervisionReport(supervision)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSupervision(supervision.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500">
            <p>designed by @w.yogaswara ps smk kcdxi 2025</p>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default AdminDashboard;
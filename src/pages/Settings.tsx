import { useState, useEffect } from "react";
import { auth, Activity, School, Task } from "@/lib/database";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings as SettingsIcon, Shield, Database, Download, Trash2, AlertTriangle, Users, Edit, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewingUserData, setViewingUserData] = useState(false);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoBackup: false,
    dataRetention: 365, // days
  });

  const [stats, setStats] = useState({
    totalActivities: 0,
    totalSchools: 0,
    totalTasks: 0,
    accountCreated: "",
  });

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    const { user } = await auth.getUser();
    if (!user) return;
    
    setCurrentUser(user);
    const adminAccess = user.role === 'admin';
    setIsAdmin(adminAccess);
    
    if (!adminAccess) {
      toast.error("Akses ditolak. Halaman ini hanya untuk admin.");
    }
  };

  const fetchAllUsers = async () => {
    try {
      const users = getData('users');
      setAllUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { user } = await auth.getUser();
      if (!user) return;

      const activities = getData<Activity>('activities').filter(a => a.user_id === user.id);
      const schools = getData<School>('schools').filter(s => s.user_id === user.id);
      const tasks = getData<Task>('tasks').filter(t => t.user_id === user.id);

      setStats({
        totalActivities: activities.length,
        totalSchools: schools.length,
        totalTasks: tasks.length,
        accountCreated: new Date(user.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSettingsUpdate = async () => {
    setLoading(true);
    try {
      // In a real app, you would save these settings to a user preferences table
      toast.success("Pengaturan berhasil disimpan!");
    } catch (error: any) {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const exportAllUserData = async () => {
    setExportLoading(true);
    try {
      const data = exportAllData();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jurnal-pengawas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Data berhasil diekspor!");
    } catch (error: any) {
      toast.error("Gagal mengekspor data");
    } finally {
      setExportLoading(false);
    }
  };

  const deleteAllUserData = async () => {
    setDeleteLoading(true);
    try {
      resetAllData();
      toast.success("Semua data berhasil dihapus!");
      fetchStats(); // Refresh stats
      fetchAllUsers(); // Refresh users
    } catch (error: any) {
      toast.error("Gagal menghapus data");
    } finally {
      setDeleteLoading(false);
    }
  };

  const viewUserData = (user: any) => {
    setSelectedUser(user);
    setViewingUserData(true);
  };

  const getUserStats = (userId: string) => {
    const activities = getData<Activity>('activities').filter(a => a.user_id === userId);
    const schools = getData<School>('schools').filter(s => s.user_id === userId);
    const tasks = getData<Task>('tasks').filter(t => t.user_id === userId);
    
    return {
      activities: activities.length,
      schools: schools.length,
      tasks: tasks.length,
    };
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Shield className="w-16 h-16 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
            <p className="text-muted-foreground text-center max-w-md">
              Halaman pengaturan ini hanya dapat diakses oleh administrator. 
              Silakan hubungi admin jika Anda memerlukan akses.
            </p>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6 max-w-6xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <SettingsIcon className="w-8 h-8" />
              Pengaturan Admin
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola pengaturan aplikasi dan data semua pengguna
            </p>
          </div>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manajemen Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((user) => {
                  const userStats = getUserStats(user.id);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.full_name || user.email}</h3>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {userStats.activities} aktivitas • {userStats.schools} sekolah • {userStats.tasks} tugas
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewUserData(user)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Lihat Data
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Statistik Admin ({currentUser?.full_name || currentUser?.email})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.totalActivities}</div>
                  <div className="text-sm text-muted-foreground">Total Aktivitas</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-secondary">{stats.totalSchools}</div>
                  <div className="text-sm text-muted-foreground">Total Sekolah</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-accent">{stats.totalTasks}</div>
                  <div className="text-sm text-muted-foreground">Total Tugas</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Bergabung</div>
                  <div className="text-sm text-muted-foreground">{stats.accountCreated}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Pengaturan Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifikasi Email</Label>
                  <div className="text-sm text-muted-foreground">
                    Terima notifikasi melalui email untuk aktivitas penting
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Backup Otomatis</Label>
                  <div className="text-sm text-muted-foreground">
                    Backup data secara otomatis setiap minggu
                  </div>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoBackup: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="retention">Retensi Data (Hari)</Label>
                <Input
                  id="retention"
                  type="number"
                  min="30"
                  max="3650"
                  value={settings.dataRetention}
                  onChange={(e) =>
                    setSettings({ ...settings, dataRetention: parseInt(e.target.value) || 365 })
                  }
                  className="w-32"
                />
                <div className="text-sm text-muted-foreground">
                  Data akan disimpan selama {settings.dataRetention} hari
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSettingsUpdate} disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Pengaturan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Manajemen Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Export Semua Data Sistem</h3>
                  <p className="text-sm text-muted-foreground">
                    Unduh semua data pengguna dalam format JSON untuk backup
                  </p>
                </div>
                <Button 
                  onClick={exportAllUserData} 
                  disabled={exportLoading}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportLoading ? "Mengekspor..." : "Export"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h3 className="font-medium text-destructive">Hapus Semua Data Sistem</h3>
                  <p className="text-sm text-muted-foreground">
                    Hapus semua data pengguna, aktivitas, sekolah, dan tugas. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteLoading}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Semua
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Konfirmasi Penghapusan Sistem
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus SEMUA data sistem? Tindakan ini akan menghapus:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Semua pengguna dan profil</li>
                          <li>Semua aktivitas dan supervisi</li>
                          <li>Semua data sekolah</li>
                          <li>Semua tugas tambahan</li>
                        </ul>
                        <br />
                        <strong>Tindakan ini tidak dapat dibatalkan!</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAllUserData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Ya, Hapus Semua Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* User Data Modal */}
          {viewingUserData && selectedUser && (
            <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Data Pengguna: {selectedUser.full_name || selectedUser.email}
                    </h2>
                    <button
                      onClick={() => setViewingUserData(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                        {selectedUser.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">NIP</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.nip || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Jabatan</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.position || '-'}</p>
                    </div>
                  </div>

                  {/* User Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    {(() => {
                      const userStats = getUserStats(selectedUser.id);
                      return (
                        <>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-primary">{userStats.activities}</div>
                            <div className="text-sm text-muted-foreground">Aktivitas</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-secondary">{userStats.schools}</div>
                            <div className="text-sm text-muted-foreground">Sekolah</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-accent">{userStats.tasks}</div>
                            <div className="text-sm text-muted-foreground">Tugas</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Aplikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versi Aplikasi:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Terakhir Diperbarui:</span>
                <span>Desember 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database:</span>
                <span>Supabase</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Framework:</span>
                <span>React + TypeScript</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Settings;
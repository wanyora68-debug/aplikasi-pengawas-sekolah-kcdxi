import { useEffect, useState } from "react";
import { auth, schools as schoolsDB, activities as activitiesDB, uploadPhoto, School } from "@/lib/localStorage";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, School as SchoolIcon, Edit, Printer, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  category: string;
  activity_name: string;
  school_id?: string;
  school_name?: string;
  date: string;
  notes: string;
  accompaniment_type?: string;
  duration_hours?: number;
  photo_url_1?: string;
  photo_url_2?: string;
}

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  const [formData, setFormData] = useState({
    category: "",
    activity_name: "",
    school_id: "",
    date: "",
    notes: "",
    accompaniment_type: "",
    duration_hours: "",
  });

  const [photos, setPhotos] = useState<{ file1: File | null; file2: File | null }>({
    file1: null,
    file2: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { user } = await auth.getUser();
    if (!user) {
      console.log("=== ACTIVITIES FETCH DEBUG ===");
      console.log("No user found in fetchData");
      return;
    }

    console.log("=== ACTIVITIES FETCH DEBUG ===");
    console.log("Fetching activities for user:", user.id);
    console.log("User email:", user.email);
    console.log("User role:", user.role);

    const [activitiesRes, schoolsRes] = await Promise.all([
      activitiesDB.getAll(user.id),
      schoolsDB.getAll(user.id),
    ]);

    console.log("Activities response:", activitiesRes);
    console.log("Schools response:", schoolsRes);

    if (activitiesRes.data) {
      const formattedActivities = activitiesRes.data
        .filter(item => item.category !== "Supervisi") // Exclude supervision
        .map(item => ({
          ...item,
          school_name: item.school_id ? 
            schoolsRes.data?.find(s => s.id === item.school_id)?.name || "Sekolah tidak ditemukan" :
            "Tidak ada sekolah"
        }));
      
      console.log("Formatted activities:", formattedActivities);
      console.log("Setting activities state with", formattedActivities.length, "items");
      setActivities(formattedActivities);
    }

    if (schoolsRes.data) {
      console.log("Setting schools state with", schoolsRes.data.length, "items");
      setSchools(schoolsRes.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await auth.getUser();
      if (!user) throw new Error("User not found");

      console.log("=== ACTIVITIES SUBMIT DEBUG ===");
      console.log("Submitting activity with user:", user.id);
      console.log("User email:", user.email);
      console.log("User role:", user.role);
      console.log("Form data:", formData);

      let photo_url_1 = null;
      let photo_url_2 = null;

      if (photos.file1) {
        photo_url_1 = await uploadPhoto(photos.file1);
        console.log("Photo 1 uploaded:", photo_url_1);
      }
      if (photos.file2) {
        photo_url_2 = await uploadPhoto(photos.file2);
        console.log("Photo 2 uploaded:", photo_url_2);
      }

      const activityData = {
        ...formData,
        user_id: user.id,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : undefined,
        photo_url_1,
        photo_url_2,
      };

      console.log("Activity data to save:", activityData);

      if (editingActivity) {
        const { error } = await activitiesDB.update(editingActivity.id, activityData);
        if (error) throw error;
        console.log("Activity updated successfully");
        toast.success("Aktivitas berhasil diperbarui!");
      } else {
        const { data: savedData, error } = await activitiesDB.create(activityData);
        if (error) throw error;
        console.log("Activity created successfully:", savedData);
        toast.success("Aktivitas berhasil ditambahkan!");
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Activity submit error:", error);
      toast.error(error.message || "Gagal menyimpan aktivitas");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      activity_name: "",
      school_id: "",
      date: "",
      notes: "",
      accompaniment_type: "",
      duration_hours: "",
    });
    setPhotos({ file1: null, file2: null });
    setEditingActivity(null);
    setOpen(false);
  };

  const handleEdit = (activity: Activity) => {
    setFormData({
      category: activity.category,
      activity_name: activity.activity_name,
      school_id: activity.school_id || "",
      date: activity.date,
      notes: activity.notes,
      accompaniment_type: activity.accompaniment_type || "",
      duration_hours: activity.duration_hours?.toString() || "",
    });
    setEditingActivity(activity);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus aktivitas ini?")) return;

    try {
      const { error } = await activitiesDB.delete(id);
      if (error) throw error;

      toast.success("Aktivitas berhasil dihapus!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus aktivitas");
    }
  };

  const handlePrint = (activity: Activity) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Aktivitas - ${activity.activity_name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { margin-bottom: 20px; }
              .label { font-weight: bold; }
              .photos { display: flex; gap: 10px; margin-top: 10px; }
              .photos img { max-width: 200px; max-height: 150px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>LAPORAN AKTIVITAS PENGAWAS SEKOLAH</h2>
            </div>
            <div class="content">
              <p><span class="label">Nama Aktivitas:</span> ${activity.activity_name}</p>
              <p><span class="label">Kategori:</span> ${activity.category}</p>
              <p><span class="label">Sekolah:</span> ${activity.school_name || 'Tidak ada sekolah'}</p>
              <p><span class="label">Tanggal:</span> ${new Date(activity.date).toLocaleDateString('id-ID')}</p>
              <p><span class="label">Tipe Pendampingan:</span> ${activity.accompaniment_type || '-'}</p>
              <p><span class="label">Durasi:</span> ${activity.duration_hours ? activity.duration_hours + ' jam' : '-'}</p>
              <p><span class="label">Catatan:</span></p>
              <p>${activity.notes}</p>
              ${activity.photo_url_1 || activity.photo_url_2 ? `
                <p><span class="label">Foto Dokumentasi:</span></p>
                <div class="photos">
                  ${activity.photo_url_1 ? `<img src="${activity.photo_url_1}" alt="Foto 1" />` : ''}
                  ${activity.photo_url_2 ? `<img src="${activity.photo_url_2}" alt="Foto 2" />` : ''}
                </div>
              ` : ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Perencanaan":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Pelaksanaan":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Pelaporan":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Aktivitas Pendampingan</h1>
              <p className="text-muted-foreground mt-1">
                Kelola aktivitas pendampingan sekolah
              </p>
            </div>
            <Button onClick={() => {
              resetForm();
              setOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Aktivitas
            </Button>
          </div>

          {/* Modal Form */}
          {open && (
            <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {editingActivity ? "Edit Aktivitas" : "Tambah Aktivitas Baru"}
                    </h2>
                    <button
                      onClick={() => setOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategori *</Label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Pilih kategori</option>
                          <option value="Perencanaan">Perencanaan</option>
                          <option value="Pelaksanaan">Pelaksanaan</option>
                          <option value="Pelaporan">Pelaporan</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Tanggal *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity_name">Nama Aktivitas *</Label>
                      <Input
                        id="activity_name"
                        placeholder="Contoh: Pendampingan Penyusunan Program Sekolah"
                        value={formData.activity_name}
                        onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school_id">Sekolah (Opsional)</Label>
                      <select
                        id="school_id"
                        value={formData.school_id}
                        onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih sekolah</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accompaniment_type">Tipe Pendampingan</Label>
                        <select
                          id="accompaniment_type"
                          value={formData.accompaniment_type}
                          onChange={(e) => setFormData({ ...formData, accompaniment_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Pilih tipe</option>
                          <option value="Individu">Individu</option>
                          <option value="Kelompok">Kelompok</option>
                          <option value="Bimlat">Bimlat</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration_hours">Durasi (Jam)</Label>
                        <Input
                          id="duration_hours"
                          type="number"
                          step="0.5"
                          placeholder="2.5"
                          value={formData.duration_hours}
                          onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan/Hasil *</Label>
                      <Textarea
                        id="notes"
                        placeholder="Tuliskan hasil observasi, rekomendasi, atau catatan penting..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Upload Foto (Maksimal 2 foto)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="photo1" className="text-sm text-muted-foreground">
                            Foto 1
                          </Label>
                          <Input
                            id="photo1"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPhotos({ ...photos, file1: file });
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="photo2" className="text-sm text-muted-foreground">
                            Foto 2
                          </Label>
                          <Input
                            id="photo2"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPhotos({ ...photos, file2: file });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          editingActivity ? "Perbarui" : "Simpan"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Activities List */}
          {activities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  Belum ada aktivitas. Klik tombol "Tambah Aktivitas" untuk memulai.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(activity.category)}>
                            {activity.category}
                          </Badge>
                          {activity.accompaniment_type && (
                            <Badge variant="outline">{activity.accompaniment_type}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{activity.activity_name}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(activity)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(activity)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(activity.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      {activity.school_name && (
                        <div className="flex items-center gap-1">
                          <SchoolIcon className="w-4 h-4" />
                          {activity.school_name}
                        </div>
                      )}
                      {activity.duration_hours && (
                        <div>Durasi: {activity.duration_hours} jam</div>
                      )}
                    </div>
                    {activity.notes && (
                      <p className="text-sm text-foreground mt-2">{activity.notes}</p>
                    )}
                    {(activity.photo_url_1 || activity.photo_url_2) && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {activity.photo_url_1 && (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={activity.photo_url_1}
                              alt="Foto aktivitas 1"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        {activity.photo_url_2 && (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={activity.photo_url_2}
                              alt="Foto aktivitas 2"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>designed by @w.yogaswara ps smk kcdxi 2025</p>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Activities;
import { useEffect, useState } from "react";
import { auth, tasks as tasksDB, uploadPhoto, initializeLocalStorage } from "@/lib/localStorage";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, MapPin, Building2, Edit, Printer, Loader2 } from "lucide-react";

interface Task {
  id: string;
  activity_name: string;
  date: string;
  location: string;
  organizer: string;
  description: string;
  photo_url_1?: string;
  photo_url_2?: string;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [formData, setFormData] = useState({
    activity_name: "",
    date: "",
    location: "",
    organizer: "",
    description: "",
  });

  const [photos, setPhotos] = useState<{ file1: File | null; file2: File | null }>({
    file1: null,
    file2: null,
  });

  useEffect(() => {
    console.log("=== TASKS COMPONENT MOUNTED ===");
    // Ensure localStorage is initialized
    initializeLocalStorage();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { user } = await auth.getUser();
    if (!user) {
      console.log("=== FETCH TASKS DEBUG ===");
      console.log("No user found in fetchTasks");
      return;
    }

    console.log("=== FETCH TASKS DEBUG ===");
    console.log("Fetching tasks for user:", user.id);
    console.log("User email:", user.email);
    console.log("User role:", user.role);
    
    const { data, error } = await tasksDB.getAll(user.id);

    if (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Gagal memuat data tugas");
      return;
    }

    console.log("Tasks data:", data);
    console.log("Setting tasks state with", data?.length || 0, "items");
    if (data) setTasks(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await auth.getUser();
      if (!user) throw new Error("User not found");

      console.log("=== TASK SUBMIT DEBUG ===");
      console.log("Submitting task with user:", user.id);
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

      const taskData = {
        ...formData,
        user_id: user.id,
        photo_url_1,
        photo_url_2,
      };

      console.log("Task data to save:", taskData);

      if (editingTask) {
        const { error } = await tasksDB.update(editingTask.id, taskData);
        if (error) throw error;
        console.log("Task updated successfully");
        toast.success("Tugas berhasil diperbarui!");
      } else {
        const { data: savedData, error } = await tasksDB.create(taskData);
        if (error) throw error;
        console.log("Task created successfully:", savedData);
        toast.success("Tugas tambahan berhasil ditambahkan!");
      }

      resetForm();
      fetchTasks();
    } catch (error: any) {
      console.error("Task submit error:", error);
      toast.error(error.message || "Gagal menyimpan tugas");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ activity_name: "", date: "", location: "", organizer: "", description: "" });
    setPhotos({ file1: null, file2: null });
    setEditingTask(null);
    setOpen(false);
  };

  const handleEdit = (task: Task) => {
    setFormData({
      activity_name: task.activity_name,
      date: task.date,
      location: task.location,
      organizer: task.organizer,
      description: task.description,
    });
    setEditingTask(task);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus tugas ini?")) return;

    try {
      const { error } = await tasksDB.delete(id);
      if (error) throw error;

      toast.success("Tugas berhasil dihapus!");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus tugas");
    }
  };

  const handlePrint = (task: Task) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Tugas Tambahan - ${task.activity_name}</title>
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
              <h2>LAPORAN TUGAS TAMBAHAN</h2>
            </div>
            <div class="content">
              <p><span class="label">Nama Kegiatan:</span> ${task.activity_name}</p>
              <p><span class="label">Tanggal:</span> ${new Date(task.date).toLocaleDateString('id-ID')}</p>
              <p><span class="label">Tempat:</span> ${task.location}</p>
              <p><span class="label">Penyelenggara:</span> ${task.organizer}</p>
              <p><span class="label">Deskripsi:</span></p>
              <p>${task.description}</p>
              ${task.photo_url_1 || task.photo_url_2 ? `
                <p><span class="label">Foto Dokumentasi:</span></p>
                <div class="photos">
                  ${task.photo_url_1 ? `<img src="${task.photo_url_1}" alt="Foto 1" />` : ''}
                  ${task.photo_url_2 ? `<img src="${task.photo_url_2}" alt="Foto 2" />` : ''}
                </div>
              ` : ''}
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

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tugas Tambahan</h1>
              <p className="text-muted-foreground mt-1">
                Catat tugas tambahan dan kegiatan lainnya
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log("Manual refresh triggered");
                  fetchTasks();
                }}
              >
                🔄 Refresh
              </Button>
              <Button onClick={() => {
                resetForm();
                setOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tugas
              </Button>
            </div>
          </div>

          {/* Modal Form */}
          {open && (
            <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {editingTask ? "Edit Tugas Tambahan" : "Tambah Tugas Tambahan"}
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
                    <div className="space-y-2">
                      <Label htmlFor="activity_name">Nama Kegiatan *</Label>
                      <Input
                        id="activity_name"
                        placeholder="Contoh: Rapat Koordinasi Pengawas"
                        value={formData.activity_name}
                        onChange={(e) =>
                          setFormData({ ...formData, activity_name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Tanggal *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Tempat Kegiatan *</Label>
                        <Input
                          id="location"
                          placeholder="Lokasi kegiatan"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({ ...formData, location: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizer">Penyelenggara *</Label>
                      <Input
                        id="organizer"
                        placeholder="Nama penyelenggara"
                        value={formData.organizer}
                        onChange={(e) =>
                          setFormData({ ...formData, organizer: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi/Hasil Kegiatan *</Label>
                      <Textarea
                        id="description"
                        placeholder="Tuliskan deskripsi atau hasil kegiatan..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
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
                          editingTask ? "Perbarui" : "Simpan"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  Belum ada tugas tambahan. Klik tombol "Tambah Tugas" untuk memulai.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{task.activity_name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(task)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(task.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {task.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {task.organizer}
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{task.description}</p>
                    
                    {(task.photo_url_1 || task.photo_url_2) && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {task.photo_url_1 && (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={task.photo_url_1}
                              alt="Foto kegiatan 1"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        {task.photo_url_2 && (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={task.photo_url_2}
                              alt="Foto kegiatan 2"
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

export default Tasks;

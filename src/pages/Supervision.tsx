import { useState, useEffect } from "react";
import { auth, schools as schoolsDB, supervisions as supervisionsDB, uploadPhoto, School, Supervision, initializeDatabase } from "@/lib/database";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, FileText, Calendar, School as SchoolIcon, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SupervisionDisplay {
  id: string;
  title: string;
  school_id: string;
  school_name: string;
  date: string;
  principal_name?: string;
  notes: string;
  photo_url_1?: string;
  photo_url_2?: string;
  created_at: string;
}

const Supervision = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupervision, setEditingSupervision] = useState<SupervisionDisplay | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    school_id: "",
    date: "",
    principal_name: "",
    notes: "",
  });

  const [photos, setPhotos] = useState<{ file1: File | null; file2: File | null }>({
    file1: null,
    file2: null,
  });

  useEffect(() => {
    console.log("=== SUPERVISION COMPONENT MOUNTED ===");
    // Ensure localStorage is initialized
    initializeDatabase();
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const { user } = await auth.getUser();
    if (!user) {
      console.log("=== FETCH SCHOOLS DEBUG ===");
      console.log("No user found in fetchSchools");
      return;
    }

    console.log("=== FETCH SCHOOLS DEBUG ===");
    console.log("Fetching schools for user:", user.id);

    const { data, error } = await schoolsDB.getAll(user.id);
    if (error) {
      console.error("Error fetching schools:", error);
      toast.error("Gagal memuat data sekolah");
      return;
    }
    
    console.log("Schools data:", data);
    if (data) {
      setSchools(data);
      // Fetch supervisions after schools are loaded
      fetchSupervisions(data);
    } else {
      // Even if no schools, still fetch supervisions
      fetchSupervisions([]);
    }
  };

  const fetchSupervisions = async (schoolsData?: School[]) => {
    const { user } = await auth.getUser();
    if (!user) {
      console.log("=== FETCH SUPERVISIONS DEBUG ===");
      console.log("No user found in fetchSupervisions");
      return;
    }

    console.log("=== FETCH SUPERVISIONS DEBUG ===");
    console.log("Fetching supervisions for user:", user.id);
    console.log("User email:", user.email);
    console.log("User role:", user.role);
    
    const { data, error } = await supervisionsDB.getAll(user.id);
    
    if (error) {
      console.error("Error fetching supervisions:", error);
      toast.error("Gagal memuat data supervisi");
      return;
    }

    console.log("Raw supervisions data:", data);
    const currentSchools = schoolsData || schools;
    console.log("Current schools:", currentSchools);
    
    const formattedData = data?.map(item => ({
      id: item.id,
      title: item.title,
      school_id: item.school_id || "",
      school_name: item.school_id ? 
        (currentSchools.find(s => s.id === item.school_id)?.name || "Sekolah tidak ditemukan") : 
        "Tidak ada sekolah",
      date: item.date,
      principal_name: item.principal_name || "",
      notes: item.notes || "",
      photo_url_1: item.photo_url_1,
      photo_url_2: item.photo_url_2,
      created_at: item.created_at,
    })) || [];

    console.log("Formatted supervisions data:", formattedData);
    console.log("Setting supervisions state with", formattedData.length, "items");
    setSupervisions(formattedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log("=== SUPERVISION SUBMIT DEBUG ===");
      console.log("Submitting supervision with user:", user.id);
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

      const supervisionData = {
        title: formData.title.trim(),
        school_id: formData.school_id || undefined,
        date: formData.date,
        principal_name: formData.principal_name.trim() || undefined,
        notes: formData.notes.trim(),
        photo_url_1,
        photo_url_2,
        user_id: user.id,
      };

      console.log("Supervision data to save:", supervisionData);

      if (editingSupervision) {
        const { error } = await supervisionsDB.update(editingSupervision.id, supervisionData);
        if (error) throw error;
        console.log("Supervision updated successfully");
        toast.success("Supervisi berhasil diperbarui!");
      } else {
        const { data: savedData, error } = await supervisionsDB.create(supervisionData);
        if (error) throw error;
        console.log("Supervision created successfully:", savedData);
        toast.success("Supervisi berhasil ditambahkan!");
      }

      resetForm();
      fetchSupervisions();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Gagal menyimpan supervisi");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      school_id: "",
      date: "",
      principal_name: "",
      notes: "",
    });
    setPhotos({ file1: null, file2: null });
    setEditingSupervision(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (supervision: SupervisionDisplay) => {
    setFormData({
      title: supervision.title,
      school_id: supervision.school_id,
      date: supervision.date,
      principal_name: supervision.principal_name || "",
      notes: supervision.notes,
    });
    setEditingSupervision(supervision);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus supervisi ini?")) return;

    const { error } = await supervisionsDB.delete(id);
    if (error) {
      toast.error("Gagal menghapus supervisi");
      return;
    }

    toast.success("Supervisi berhasil dihapus");
    fetchSupervisions();
  };

  const handlePrint = (supervision: SupervisionDisplay) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Supervisi - ${supervision.title}</title>
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
              <h2>LAPORAN SUPERVISI SEKOLAH</h2>
            </div>
            <div class="content">
              <p><span class="label">Judul Supervisi:</span> ${supervision.title}</p>
              <p><span class="label">Sekolah:</span> ${supervision.school_name}</p>
              <p><span class="label">Tanggal:</span> ${new Date(supervision.date).toLocaleDateString('id-ID')}</p>
              ${supervision.principal_name ? `<p><span class="label">Kepala Sekolah:</span> ${supervision.principal_name}</p>` : ''}
              <p><span class="label">Catatan:</span></p>
              <p>${supervision.notes}</p>
              ${supervision.photo_url_1 || supervision.photo_url_2 ? `
                <p><span class="label">Foto Dokumentasi:</span></p>
                <div class="photos">
                  ${supervision.photo_url_1 ? `<img src="${supervision.photo_url_1}" alt="Foto 1" />` : ''}
                  ${supervision.photo_url_2 ? `<img src="${supervision.photo_url_2}" alt="Foto 2" />` : ''}
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Supervisi</h1>
              <p className="text-muted-foreground">Kelola kegiatan supervisi sekolah</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log("Manual refresh triggered");
                  fetchSchools();
                }}
              >
                🔄 Refresh
              </Button>
              <Button onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Supervisi
              </Button>
            </div>
          </div>

          {/* Modal Form */}
          {isDialogOpen && (
            <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {editingSupervision ? "Edit Supervisi" : "Tambah Supervisi Baru"}
                    </h2>
                    <button
                      onClick={() => setIsDialogOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Judul Kegiatan *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Contoh: Supervisi Guru Kelas 1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school">Nama Sekolah (Opsional)</Label>
                      <select
                        id="school"
                        value={formData.school_id}
                        onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih sekolah atau kosongkan</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Tanggal Pelaksanaan *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="principal_name">Nama PIC/Kepala Sekolah/Guru (Opsional)</Label>
                      <Input
                        id="principal_name"
                        value={formData.principal_name}
                        onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                        placeholder="Nama person in charge"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan/Temuan *</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Tuliskan hasil supervisi, temuan, rekomendasi, dll..."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Upload Foto Dokumentasi (Maksimal 2 foto)</Label>
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

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || !formData.title.trim() || !formData.date || !formData.notes.trim()}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          editingSupervision ? "Perbarui" : "Simpan"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Supervision List */}
          <div className="space-y-4">
            {supervisions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Belum ada supervisi. Klik tombol "Tambah Supervisi" untuk memulai.
                  </p>
                </CardContent>
              </Card>
            ) : (
              supervisions.map((supervision) => (
                <Card key={supervision.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="w-fit">Supervisi</Badge>
                        <CardTitle className="text-lg">{supervision.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <SchoolIcon className="w-4 h-4" />
                            {supervision.school_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(supervision.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        {supervision.principal_name && (
                          <p className="text-sm text-muted-foreground">
                            PIC: {supervision.principal_name}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(supervision)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(supervision)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(supervision.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-medium mb-2">Catatan/Temuan:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {supervision.notes}
                      </p>
                    </div>
                    {(supervision.photo_url_1 || supervision.photo_url_2) && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Foto Dokumentasi:</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {supervision.photo_url_1 && (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                              <img
                                src={supervision.photo_url_1}
                                alt="Foto supervisi 1"
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          {supervision.photo_url_2 && (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                              <img
                                src={supervision.photo_url_2}
                                alt="Foto supervisi 2"
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>designed by @w.yogaswara ps smk kcdxi 2025</p>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Supervision;
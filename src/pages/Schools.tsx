import { useEffect, useState } from "react";
import { auth, schools as schoolsDB, uploadPhoto } from "@/lib/localStorage";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, School as SchoolIcon, Edit, Printer, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface School {
  id: string;
  name: string;
  npsn?: string;
  address?: string;
  level: 'SLB' | 'SMA' | 'SMK';
  principal_name?: string;
  photo_url_1?: string;
  photo_url_2?: string;
}

const Schools = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    npsn: "",
    address: "",
    level: "" as 'SLB' | 'SMA' | 'SMK' | "",
    principal_name: "",
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const { user } = await auth.getUser();
    if (!user) return;

    const { data, error } = await schoolsDB.getAll(user.id);

    if (error) {
      toast.error("Gagal memuat data sekolah");
      return;
    }

    if (data) setSchools(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await auth.getUser();
      if (!user) throw new Error("User not found");

      const schoolData = {
        ...formData,
        user_id: user.id,
      };

      if (editingSchool) {
        const { error } = await schoolsDB.update(editingSchool.id, schoolData);
        if (error) throw error;
        toast.success("Sekolah berhasil diperbarui!");
      } else {
        const { error } = await schoolsDB.create(schoolData);
        if (error) throw error;
        toast.success("Sekolah berhasil ditambahkan!");
      }

      resetForm();
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan sekolah");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", npsn: "", address: "", level: "", principal_name: "" });
    setEditingSchool(null);
    setOpen(false);
  };

  const handleEdit = (school: School) => {
    setFormData({
      name: school.name,
      npsn: school.npsn || "",
      address: school.address || "",
      level: school.level,
      principal_name: school.principal_name || "",
    });
    setEditingSchool(school);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus sekolah ini?")) return;

    try {
      const { error } = await schoolsDB.delete(id);
      if (error) throw error;

      toast.success("Sekolah berhasil dihapus!");
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus sekolah");
    }
  };

  const handlePrint = (school: School) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Data Sekolah - ${school.name}</title>
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
              <h2>DATA SEKOLAH DAMPINGAN</h2>
            </div>
            <div class="content">
              <p><span class="label">Nama Sekolah:</span> ${school.name}</p>
              <p><span class="label">Jenjang:</span> ${school.level}</p>
              <p><span class="label">NPSN:</span> ${school.npsn || '-'}</p>
              <p><span class="label">Alamat:</span> ${school.address || '-'}</p>
              <p><span class="label">Kepala Sekolah:</span> ${school.principal_name || '-'}</p>
              ${school.photo_url_1 || school.photo_url_2 ? `
                <p><span class="label">Foto Sekolah:</span></p>
                <div class="photos">
                  ${school.photo_url_1 ? `<img src="${school.photo_url_1}" alt="Foto 1" />` : ''}
                  ${school.photo_url_2 ? `<img src="${school.photo_url_2}" alt="Foto 2" />` : ''}
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case "SLB":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "SMA":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "SMK":
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
              <h1 className="text-3xl font-bold text-foreground">Sekolah Dampingan</h1>
              <p className="text-muted-foreground mt-1">
                Kelola daftar sekolah yang didampingi
              </p>
            </div>
            <Button onClick={() => {
              resetForm();
              setOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Sekolah
            </Button>
          </div>

          {/* Modal Form */}
          {open && (
            <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {editingSchool ? "Edit Sekolah" : "Tambah Sekolah Baru"}
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
                      <Label htmlFor="name">Nama Sekolah *</Label>
                      <Input
                        id="name"
                        placeholder="Contoh: SMAN 1 Jakarta"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level">Jenjang *</Label>
                      <select
                        id="level"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value as 'SLB' | 'SMA' | 'SMK' })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih jenjang</option>
                        <option value="SLB">SLB</option>
                        <option value="SMA">SMA</option>
                        <option value="SMK">SMK</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="principal_name">Nama Kepala Sekolah</Label>
                      <Input
                        id="principal_name"
                        placeholder="Nama Kepala Sekolah"
                        value={formData.principal_name}
                        onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="npsn">NPSN (Opsional)</Label>
                      <Input
                        id="npsn"
                        placeholder="10101010"
                        value={formData.npsn}
                        onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Alamat (Opsional)</Label>
                      <Input
                        id="address"
                        placeholder="Jalan Contoh No. 123"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
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
                          editingSchool ? "Perbarui" : "Simpan"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Schools List */}
          {schools.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <SchoolIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Belum ada sekolah dampingan. Klik tombol "Tambah Sekolah" untuk memulai.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <Card key={school.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <Badge className={getLevelColor(school.level)}>
                          {school.level}
                        </Badge>
                        <CardTitle className="text-lg">{school.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(school)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(school)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(school.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {school.principal_name && (
                      <p className="text-sm text-muted-foreground">
                        Kepala Sekolah: {school.principal_name}
                      </p>
                    )}
                    {school.npsn && (
                      <p className="text-sm text-muted-foreground">
                        NPSN: {school.npsn}
                      </p>
                    )}
                    {school.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{school.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Schools;
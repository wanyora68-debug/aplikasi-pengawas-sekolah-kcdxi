import { useEffect, useState } from "react";
import { auth, profiles, uploadPhoto } from "@/lib/database";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Briefcase, Hash, Camera, Loader2 } from "lucide-react";

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    nip: "",
    position: "",
    pangkat: "",
    unit_kerja: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { user } = await auth.getUser();
    if (!user) return;

    setEmail(user.email || "");
    setCurrentUser(user);

    setFormData({
      full_name: user.full_name || "",
      nip: user.nip || "",
      position: user.position || "",
      pangkat: user.pangkat || "",
      unit_kerja: user.unit_kerja || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await profiles.update(user.id, formData);
      if (error) throw error;

      toast.success("Profil berhasil diperbarui!");
      fetchProfile(); // Refresh profile data
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);
    try {
      const { user } = await auth.getUser();
      if (!user) throw new Error("User not found");

      const photoUrl = await uploadPhoto(file);
      
      const { error } = await profiles.update(user.id, { profile_photo: photoUrl });
      if (error) throw error;

      toast.success("Foto profil berhasil diperbarui!");
      fetchProfile(); // Refresh profile data
    } catch (error: any) {
      toast.error(error.message || "Gagal mengupload foto profil");
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profil</h1>
            <p className="text-muted-foreground mt-1">
              Kelola informasi profil Anda
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {currentUser?.profile_photo ? (
                      <img
                        src={currentUser.profile_photo}
                        alt="Foto Profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <Label htmlFor="profile-photo" className="cursor-pointer">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/90">
                        {photoLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </div>
                    </Label>
                    <Input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={photoLoading}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Klik ikon kamera untuk mengubah foto profil
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email tidak dapat diubah
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama Lengkap
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Nama Lengkap"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nip" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    NIP (Opsional)
                  </Label>
                  <Input
                    id="nip"
                    value={formData.nip}
                    onChange={(e) =>
                      setFormData({ ...formData, nip: e.target.value })
                    }
                    placeholder="Nomor Induk Pegawai"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Jabatan
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="Pengawas Sekolah"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pangkat" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Pangkat/Golongan
                  </Label>
                  <Input
                    id="pangkat"
                    value={formData.pangkat}
                    onChange={(e) =>
                      setFormData({ ...formData, pangkat: e.target.value })
                    }
                    placeholder="Contoh: Pembina, IV/a"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_kerja" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Unit Kerja
                  </Label>
                  <Input
                    id="unit_kerja"
                    value={formData.unit_kerja}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_kerja: e.target.value })
                    }
                    placeholder="Dinas Pendidikan Provinsi Jawa Barat"
                  />
                </div>

                <Button type="submit" disabled={loading || photoLoading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Profile;

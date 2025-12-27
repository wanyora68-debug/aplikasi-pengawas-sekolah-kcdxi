import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, initializeLocalStorage } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, UserPlus, ArrowLeft, AlertCircle, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    nip: "",
    position: "Pengawas Sekolah",
    pangkat: "",
    unit_kerja: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Nama lengkap wajib diisi";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password dan konfirmasi password tidak sama";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Ensure localStorage is initialized
      initializeLocalStorage();

      const { user, error } = await auth.signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        nip: formData.nip || undefined,
        position: formData.position || undefined,
        pangkat: formData.pangkat || undefined,
        unit_kerja: formData.unit_kerja || undefined,
      });

      if (error) {
        if (error.message.includes("sudah terdaftar")) {
          setErrors({ email: error.message });
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (user) {
        toast.success("Pendaftaran berhasil! Silakan login dengan akun baru Anda.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Register error:", error);
      toast.error(error.message || "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const positionOptions = [
    "Pengawas Sekolah",
    "Pengawas TK/PAUD",
    "Pengawas SD",
    "Pengawas SMP",
    "Pengawas SMA",
    "Pengawas SMK",
    "Pengawas SLB",
    "Koordinator Pengawas",
    "Kepala Sekolah",
    "Guru",
    "Staff Dinas Pendidikan",
    "Lainnya"
  ];

  const pangkatOptions = [
    "Penata Muda, III/a",
    "Penata Muda Tingkat I, III/b",
    "Penata, III/c",
    "Penata Tingkat I, III/d",
    "Pembina, IV/a",
    "Pembina Tingkat I, IV/b",
    "Pembina Utama Muda, IV/c",
    "Pembina Utama Madya, IV/d",
    "Pembina Utama, IV/e"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          {/* Logo Cabang Dinas Pendidikan Wilayah XI */}
          <div className="mx-auto w-20 h-20 mb-4 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-white font-bold text-lg">XI</div>
              <div className="text-white text-xs">CADISDIK</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Daftar Akun Baru</h1>
          <h2 className="text-lg font-semibold text-green-600">Cabang Dinas Pendidikan Wilayah XI</h2>
          <p className="text-gray-600">Bergabunglah dengan Jurnal Pengawas Sekolah</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">Akun</span>
          </div>
          <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Profil</span>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => step === 1 ? navigate("/login") : setStep(1)}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-xl">
                  {step === 1 ? "Informasi Akun" : "Informasi Profil"}
                </CardTitle>
                <CardDescription>
                  {step === 1 
                    ? "Masukkan informasi dasar akun Anda" 
                    : "Lengkapi profil Anda (opsional)"
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleRegister} className="space-y-4">
              {step === 1 ? (
                // Step 1: Basic Account Info
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Lengkap *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={formData.full_name}
                      onChange={handleChange}
                      className={errors.full_name ? "border-red-500" : ""}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-500">{errors.full_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        value={formData.password}
                        onChange={handleChange}
                        className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full">
                    Lanjutkan ke Profil
                  </Button>
                </>
              ) : (
                // Step 2: Profile Info
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nip">NIP</Label>
                      <Input
                        id="nip"
                        name="nip"
                        type="text"
                        placeholder="Nomor Induk Pegawai"
                        value={formData.nip}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Jabatan</Label>
                      <Select
                        value={formData.position}
                        onValueChange={(value) => handleSelectChange("position", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {positionOptions.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pangkat">Pangkat/Golongan</Label>
                    <Select
                      value={formData.pangkat}
                      onValueChange={(value) => handleSelectChange("pangkat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pangkat/golongan" />
                      </SelectTrigger>
                      <SelectContent>
                        {pangkatOptions.map((pangkat) => (
                          <SelectItem key={pangkat} value={pangkat}>
                            {pangkat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_kerja">Unit Kerja</Label>
                    <Input
                      id="unit_kerja"
                      name="unit_kerja"
                      type="text"
                      placeholder="Dinas Pendidikan Provinsi/Kabupaten/Kota"
                      value={formData.unit_kerja}
                      onChange={handleChange}
                    />
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Informasi profil bersifat opsional dan dapat diubah nanti di halaman pengaturan.
                    </AlertDescription>
                  </Alert>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Kembali
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mendaftar...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <UserPlus className="w-4 h-4" />
                          <span>Daftar</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>

            {step === 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Sudah punya akun?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-green-600 hover:text-green-500 transition-colors"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p className="text-xs">designed by @w.yogaswara ps smk kcdxi 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, initializeDatabase } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@app.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Ensure database is initialized
      initializeDatabase();
      
      const { user, error } = await auth.signIn(email, password);

      if (error) {
        setError(error.message);
        toast.error(error.message);
        return;
      }

      if (user) {
        toast.success(`Selamat datang, ${user.full_name}!`);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.message || "Gagal login";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Quick login function
  const quickLogin = async () => {
    setEmail("admin@app.com");
    setPassword("123456");
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          {/* Logo Cabang Dinas Pendidikan Wilayah XI */}
          <div className="mx-auto w-20 h-20 mb-4 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-white font-bold text-lg">XI</div>
              <div className="text-white text-xs">CADISDIK</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Jurnal Pengawas Sekolah</h1>
          <h2 className="text-lg font-semibold text-blue-600">Cabang Dinas Pendidikan Wilayah XI</h2>
          <p className="text-gray-600">Masuk ke akun Anda untuk melanjutkan</p>
        </div>

        {/* Quick Login Button */}
        <Card className="shadow-lg bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <Button 
              onClick={quickLogin}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              🚀 Login Cepat (Admin)
            </Button>
            <p className="text-center text-sm text-green-700 mt-2">
              Klik untuk langsung masuk sebagai admin
            </p>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Masuk</CardTitle>
            <CardDescription className="text-center">
              Masukkan email dan password Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
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
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Masuk...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>Masuk</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Belum punya akun?{" "}
                  <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Daftar sekarang
                  </Link>
                </p>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Login Cepat:</strong> admin@app.com / 123456
                </AlertDescription>
              </Alert>
            </div>
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

export default Login;

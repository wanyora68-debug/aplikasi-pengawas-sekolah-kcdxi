import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  ClipboardList, 
  School, 
  FileText, 
  Menu, 
  LogOut,
  User,
  Eye,
  BarChart3,
  Settings as SettingsIcon,
  Shield,
  Users
} from "lucide-react";
import { toast } from "sonner";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { user } = await auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Berhasil logout");
      navigate("/login");
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  // Navigation items for regular users
  const userNavItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/activities", icon: ClipboardList, label: "Aktivitas" },
    { path: "/supervision", icon: Eye, label: "Supervisi" },
    { path: "/schools", icon: School, label: "Sekolah" },
    { path: "/tasks", icon: FileText, label: "Tugas Tambahan" },
    { path: "/reports", icon: BarChart3, label: "Laporan" },
    { path: "/settings", icon: SettingsIcon, label: "Pengaturan" },
    { path: "/profile", icon: User, label: "Profil" },
  ];

  // Navigation items for admin users
  const adminNavItems = [
    { path: "/admin", icon: Shield, label: "Admin Dashboard" },
    { path: "/admin/users", icon: Users, label: "Kelola Pengawas" },
    { path: "/dashboard", icon: Home, label: "Dashboard Pengawas" },
    { path: "/activities", icon: ClipboardList, label: "Aktivitas" },
    { path: "/supervision", icon: Eye, label: "Supervisi" },
    { path: "/schools", icon: School, label: "Sekolah" },
    { path: "/tasks", icon: FileText, label: "Tugas Tambahan" },
    { path: "/reports", icon: BarChart3, label: "Laporan" },
    { path: "/settings", icon: SettingsIcon, label: "Pengaturan" },
    { path: "/profile", icon: User, label: "Profil" },
  ];

  const navItems = currentUser?.role === 'admin' ? adminNavItems : userNavItems;

  const NavLinks = () => (
    <>
      {currentUser?.role === 'admin' && (
        <div className="mb-4">
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin Panel
          </div>
          {adminNavItems.slice(0, 2).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
            Pengawas Panel
          </div>
        </div>
      )}
      
      {(currentUser?.role === 'admin' ? adminNavItems.slice(2) : userNavItems).map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            location.pathname === item.path
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-card">
        <div className="flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Jurnal Pengawas</h1>
            {currentUser?.role === 'admin' && (
              <p className="text-xs text-muted-foreground">Administrator</p>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  {currentUser?.role === 'admin' && (
                    <p className="text-sm text-muted-foreground">Administrator</p>
                  )}
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  <NavLinks />
                </nav>
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-card min-h-screen sticky top-0">
          <div className="flex flex-col h-screen">
            <div className="p-6 border-b">
              <h1 className="text-xl font-bold text-foreground">
                Jurnal Pengawas Sekolah
              </h1>
              {currentUser?.role === 'admin' && (
                <p className="text-sm text-muted-foreground mt-1">Administrator Panel</p>
              )}
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <NavLinks />
            </nav>
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

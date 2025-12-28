# Aplikasi Pengawas Sekolah KCDXI

Aplikasi digital untuk memfasilitasi proses refleksi manajerial Kepala Sekolah SMK Cabang Dinas Pendidikan Wilayah XI Provinsi Jawa Barat.

## 🚀 Fitur Utama

- **Dashboard Statistik** - Ringkasan aktivitas dan data pengawasan
- **Manajemen Sekolah** - Kelola data sekolah binaan
- **Aktivitas Pendampingan** - Catat kegiatan pendampingan sekolah
- **Supervisi** - Dokumentasi kegiatan supervisi
- **Tugas Tambahan** - Pencatatan tugas dan kegiatan lainnya
- **Laporan** - Generate laporan komprehensif dengan dokumentasi foto
- **Autentikasi** - Sistem login dan registrasi yang aman

## 🛠️ Teknologi

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks
- **Data Storage**: localStorage (untuk development)
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📦 Instalasi

1. Clone repository:
```bash
git clone https://github.com/wanyora68-debug/aplikasi-pengawas-sekolah-kcdxi.git
cd aplikasi-pengawas-sekolah-kcdxi
```

2. Install dependencies:
```bash
npm install
```

3. Jalankan development server:
```bash
npm run dev
```

4. Buka browser dan akses: `http://localhost:8083`

## 🌐 Deployment

Aplikasi ini siap untuk di-deploy ke Vercel:

1. Push code ke GitHub repository
2. Connect repository ke Vercel
3. Vercel akan otomatis build dan deploy

### Build Commands
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔧 Konfigurasi

Aplikasi berjalan pada port 8083 secara default. Untuk mengubah port, edit file `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    host: "::",
    port: 8083, // Ubah port di sini
  },
  // ...
});
```

## 👤 Akun Demo

Untuk testing, gunakan akun demo berikut:

- **Email**: `pengawas@demo.com`
- **Password**: `demo123`

Atau buat akun baru melalui halaman registrasi.

## 📱 Penggunaan

1. **Login/Register** - Masuk dengan akun yang sudah ada atau buat akun baru
2. **Dashboard** - Lihat ringkasan statistik aktivitas
3. **Sekolah** - Tambah dan kelola data sekolah binaan
4. **Aktivitas** - Catat kegiatan pendampingan dengan kategori:
   - Perencanaan
   - Pelaksanaan  
   - Pelaporan
5. **Supervisi** - Dokumentasi kegiatan supervisi sekolah
6. **Tugas Tambahan** - Catat kegiatan dan tugas lainnya
7. **Laporan** - Generate laporan bulanan/tahunan dengan dokumentasi foto

## 📊 Fitur Laporan

- Laporan bulanan dan tahunan
- Statistik kegiatan per kategori
- Dokumentasi foto kegiatan
- Export ke PDF untuk pencetakan
- Format laporan sesuai standar dinas

## 🔒 Keamanan

- Autentikasi berbasis session
- Validasi input form
- Data isolation per user
- Secure file upload untuk foto

## 🎨 UI/UX

- Responsive design untuk desktop dan mobile
- Modern interface dengan Tailwind CSS
- Komponen UI konsisten dengan shadcn/ui
- Dark/light mode support
- Toast notifications untuk feedback

## 📝 Development

### Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### Project Structure

```
src/
├── components/      # Reusable components
├── pages/          # Page components
├── lib/            # Utilities and localStorage
├── hooks/          # Custom React hooks
└── integrations/   # External integrations
```

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Project ini dibuat untuk Cabang Dinas Pendidikan Wilayah XI Provinsi Jawa Barat.

## 👨‍💻 Developer

**Designed by @w.yogaswara ps smk kcdxi 2025**

---

*Aplikasi Pengawas Sekolah KCDXI - Cabang Dinas Pendidikan Wilayah XI Provinsi Jawa Barat*
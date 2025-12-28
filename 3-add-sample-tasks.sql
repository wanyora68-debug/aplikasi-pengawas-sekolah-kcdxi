-- SCRIPT 3: Add Sample Tasks Data
-- Jalankan script ini SETELAH script 1 dan 2 berhasil

-- Hapus data sample lama jika ada
DELETE FROM public.tasks WHERE description LIKE '%sample%' OR description LIKE '%demo%';

-- Tambah sample data tasks untuk testing
INSERT INTO public.tasks (
    activity_name, date, location, organizer, description, user_id, created_at, updated_at
) VALUES 
(
    'Rapat Koordinasi Pengawas Bulanan',
    '2025-01-15',
    'Kantor Cabang Dinas Pendidikan Wilayah XI',
    'Cabang Dinas Pendidikan',
    'Rapat koordinasi rutin bulanan untuk evaluasi program kerja pengawasan sekolah',
    (SELECT id FROM public.users WHERE email = 'pengawas@demo.com' LIMIT 1),
    NOW(),
    NOW()
),
(
    'Workshop Kurikulum Merdeka',
    '2025-01-20',
    'LPMP Jawa Barat',
    'LPMP Jawa Barat',
    'Workshop implementasi Kurikulum Merdeka untuk pengawas sekolah se-Jawa Barat',
    (SELECT id FROM public.users WHERE email = 'pengawas@demo.com' LIMIT 1),
    NOW(),
    NOW()
),
(
    'Verifikasi Akreditasi Sekolah',
    '2025-01-25',
    'SMK Negeri 1 Karawang',
    'BAN-S/M',
    'Kegiatan verifikasi dokumen dan visitasi untuk proses akreditasi sekolah',
    (SELECT id FROM public.users WHERE email = 'pengawas@demo.com' LIMIT 1),
    NOW(),
    NOW()
);

-- Verifikasi hasil
SELECT 'Sample tasks added successfully!' as status;
SELECT COUNT(*) as total_tasks FROM public.tasks;
SELECT activity_name, date, location FROM public.tasks ORDER BY date;
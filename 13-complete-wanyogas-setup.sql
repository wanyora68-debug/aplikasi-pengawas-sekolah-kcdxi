-- SCRIPT 13: Complete Setup for wanyogas@gmail.com
-- Script lengkap untuk membuat user baru dengan password 123456

-- LANGKAH 1: Buat user di auth.users dengan password 123456
-- (Ini harus dilakukan manual di Supabase Auth Dashboard atau menggunakan API)

-- LANGKAH 2: Buat profile di public.users
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Generate UUID untuk user baru
    new_user_id := uuid_generate_v4();
    
    -- Insert ke public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        nip,
        position,
        pangkat,
        unit_kerja,
        role,
        created_at
    ) VALUES (
        new_user_id,
        'wanyogas@gmail.com',
        'Wanyogas Pengawas',
        '196801011990031001',
        'Pengawas Sekolah',
        'Pembina, IV/a',
        'Cabang Dinas Pendidikan Wilayah XI Garut',
        'user',
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        nip = EXCLUDED.nip,
        position = EXCLUDED.position,
        pangkat = EXCLUDED.pangkat,
        unit_kerja = EXCLUDED.unit_kerja;
    
    -- Buat beberapa data contoh untuk user ini
    -- Sekolah contoh
    INSERT INTO public.schools (
        id,
        name,
        npsn,
        address,
        level,
        principal_name,
        user_id,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        'SMK Negeri 1 Garut',
        '20219001',
        'Jl. Raya Garut No. 123, Garut',
        'SMK',
        'Drs. Kepala SMK Garut, M.Pd',
        new_user_id,
        NOW()
    );
    
    -- Aktivitas contoh
    INSERT INTO public.activities (
        id,
        activity_name,
        category,
        date,
        notes,
        user_id,
        created_at,
        updated_at
    ) VALUES (
        uuid_generate_v4(),
        'Pendampingan Kurikulum Merdeka',
        'Pendampingan',
        CURRENT_DATE - INTERVAL '5 days',
        'Pendampingan implementasi kurikulum merdeka di SMK Negeri 1 Garut. Hasil pendampingan menunjukkan kemajuan yang baik dalam penerapan pembelajaran berbasis proyek.',
        new_user_id,
        NOW(),
        NOW()
    );
    
    -- Supervisi contoh
    INSERT INTO public.supervisions (
        id,
        title,
        date,
        principal_name,
        notes,
        user_id,
        created_at,
        updated_at
    ) VALUES (
        uuid_generate_v4(),
        'Supervisi Pembelajaran SMK Garut',
        CURRENT_DATE - INTERVAL '3 days',
        'Drs. Kepala SMK Garut, M.Pd',
        'Supervisi pembelajaran di SMK Negeri 1 Garut menunjukkan:

1. Guru sudah menerapkan metode pembelajaran aktif
2. Siswa antusias dalam mengikuti pembelajaran
3. Fasilitas pembelajaran memadai
4. Perlu peningkatan dalam penggunaan teknologi

Rekomendasi:
- Pelatihan penggunaan teknologi pembelajaran
- Pengadaan perangkat pembelajaran digital
- Monitoring berkala setiap bulan',
        new_user_id,
        NOW(),
        NOW()
    );
    
    -- Tugas tambahan contoh
    INSERT INTO public.tasks (
        id,
        activity_name,
        date,
        location,
        organizer,
        description,
        user_id,
        created_at,
        updated_at
    ) VALUES (
        uuid_generate_v4(),
        'Workshop Pengembangan Kompetensi Pengawas',
        CURRENT_DATE + INTERVAL '10 days',
        'Aula Dinas Pendidikan Garut',
        'Dinas Pendidikan Kabupaten Garut',
        'Workshop pengembangan kompetensi pengawas sekolah dalam era digital. Materi meliputi:

1. Supervisi berbasis teknologi
2. Evaluasi pembelajaran online
3. Manajemen data pendidikan
4. Komunikasi efektif dengan stakeholder

Durasi: 2 hari
Sertifikat: 30 JP',
        new_user_id,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'User wanyogas@gmail.com dan data contoh berhasil dibuat dengan ID: %', new_user_id;
END $$;

-- Verifikasi hasil
SELECT 'Setup lengkap untuk wanyogas@gmail.com berhasil!' as status;

SELECT 
    u.email,
    u.full_name,
    u.position,
    COUNT(DISTINCT s.id) as total_schools,
    COUNT(DISTINCT a.id) as total_activities,
    COUNT(DISTINCT sup.id) as total_supervisions,
    COUNT(DISTINCT t.id) as total_tasks
FROM public.users u
LEFT JOIN public.schools s ON u.id = s.user_id
LEFT JOIN public.activities a ON u.id = a.user_id
LEFT JOIN public.supervisions sup ON u.id = sup.user_id
LEFT JOIN public.tasks t ON u.id = t.user_id
WHERE u.email = 'wanyogas@gmail.com'
GROUP BY u.id, u.email, u.full_name, u.position;
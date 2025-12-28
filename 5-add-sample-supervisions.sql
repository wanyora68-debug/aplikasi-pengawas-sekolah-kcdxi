-- SCRIPT 5: Add Sample Supervision Data
-- Jalankan script ini SETELAH script 4 berhasil untuk menambahkan data contoh supervisi

-- Pastikan ada user demo terlebih dahulu
DO $$
DECLARE
    demo_user_id UUID;
    admin_user_id UUID;
    school1_id UUID;
    school2_id UUID;
BEGIN
    -- Cari user demo
    SELECT id INTO demo_user_id FROM public.users WHERE email = 'pendemo@demo.com' LIMIT 1;
    SELECT id INTO admin_user_id FROM public.users WHERE email = 'pengawas@demo.com' LIMIT 1;
    
    -- Jika tidak ada user demo, gunakan user pertama yang ada
    IF demo_user_id IS NULL THEN
        SELECT id INTO demo_user_id FROM public.users ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Jika masih tidak ada user, buat user demo
    IF demo_user_id IS NULL THEN
        INSERT INTO public.users (id, email, full_name, role, created_at)
        VALUES (
            uuid_generate_v4(),
            'pendemo@demo.com',
            'Pengawas Demo',
            'user',
            NOW()
        )
        RETURNING id INTO demo_user_id;
        
        RAISE NOTICE 'Created demo user with ID: %', demo_user_id;
    END IF;
    
    -- Cari atau buat sekolah contoh
    SELECT id INTO school1_id FROM public.schools WHERE name LIKE '%SMK%' AND user_id = demo_user_id LIMIT 1;
    SELECT id INTO school2_id FROM public.schools WHERE name LIKE '%SMA%' AND user_id = demo_user_id LIMIT 1;
    
    -- Jika tidak ada sekolah, buat sekolah contoh
    IF school1_id IS NULL THEN
        INSERT INTO public.schools (id, name, npsn, address, level, principal_name, user_id, created_at)
        VALUES (
            uuid_generate_v4(),
            'SMK Negeri 1 Contoh',
            '12345678',
            'Jl. Pendidikan No. 123, Kota Contoh',
            'SMK',
            'Drs. Kepala Sekolah, M.Pd',
            demo_user_id,
            NOW()
        )
        RETURNING id INTO school1_id;
    END IF;
    
    IF school2_id IS NULL THEN
        INSERT INTO public.schools (id, name, npsn, address, level, principal_name, user_id, created_at)
        VALUES (
            uuid_generate_v4(),
            'SMA Negeri 2 Contoh',
            '87654321',
            'Jl. Ilmu Pengetahuan No. 456, Kota Contoh',
            'SMA',
            'Dra. Kepala SMA, M.Pd',
            demo_user_id,
            NOW()
        )
        RETURNING id INTO school2_id;
    END IF;
    
    -- Hapus data supervisi lama jika ada
    DELETE FROM public.supervisions WHERE user_id = demo_user_id;
    
    -- Insert sample supervision data
    INSERT INTO public.supervisions (
        id,
        title,
        school_id,
        date,
        principal_name,
        notes,
        user_id,
        created_at,
        updated_at
    ) VALUES 
    (
        uuid_generate_v4(),
        'Supervisi Pembelajaran Kelas X',
        school1_id,
        CURRENT_DATE - INTERVAL '7 days',
        'Drs. Kepala Sekolah, M.Pd',
        'Supervisi pembelajaran di kelas X jurusan Teknik Komputer dan Jaringan. Hasil supervisi menunjukkan:

1. Guru sudah menyiapkan RPP dengan baik
2. Metode pembelajaran sudah sesuai dengan kurikulum
3. Siswa aktif dalam pembelajaran
4. Fasilitas laboratorium perlu ditingkatkan

Rekomendasi:
- Perlu penambahan perangkat komputer di lab
- Guru perlu pelatihan software terbaru
- Evaluasi berkala setiap bulan',
        demo_user_id,
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '7 days'
    ),
    (
        uuid_generate_v4(),
        'Supervisi Administrasi Guru',
        school1_id,
        CURRENT_DATE - INTERVAL '14 days',
        'Drs. Kepala Sekolah, M.Pd',
        'Supervisi administrasi guru mata pelajaran produktif:

Temuan:
- 85% guru sudah melengkapi administrasi
- Beberapa guru belum update silabus
- Penilaian siswa sudah tertib

Tindak lanjut:
- Workshop penyusunan silabus
- Pendampingan guru senior
- Monitoring bulanan',
        demo_user_id,
        NOW() - INTERVAL '14 days',
        NOW() - INTERVAL '14 days'
    ),
    (
        uuid_generate_v4(),
        'Supervisi Manajemen Sekolah',
        school2_id,
        CURRENT_DATE - INTERVAL '21 days',
        'Dra. Kepala SMA, M.Pd',
        'Supervisi manajemen dan kepemimpinan sekolah:

Aspek yang dievaluasi:
1. Perencanaan program sekolah
2. Pelaksanaan program
3. Evaluasi dan monitoring
4. Pengembangan SDM

Hasil:
- Program sekolah sudah tersusun dengan baik
- Pelaksanaan sesuai timeline
- Perlu peningkatan sistem monitoring
- SDM kompeten dan berdedikasi

Rekomendasi:
- Implementasi sistem monitoring digital
- Pelatihan kepemimpinan untuk wakil kepala sekolah
- Pengembangan program unggulan sekolah',
        demo_user_id,
        NOW() - INTERVAL '21 days',
        NOW() - INTERVAL '21 days'
    ),
    (
        uuid_generate_v4(),
        'Supervisi Sarana Prasarana',
        school2_id,
        CURRENT_DATE - INTERVAL '3 days',
        'Dra. Kepala SMA, M.Pd',
        'Supervisi kondisi sarana dan prasarana sekolah:

Kondisi Baik:
- Ruang kelas terawat
- Perpustakaan lengkap
- Laboratorium IPA memadai

Perlu Perbaikan:
- Beberapa kursi rusak
- Proyektor di 2 kelas tidak berfungsi
- Toilet siswa perlu renovasi

Rencana Tindak Lanjut:
- Pengajuan dana perbaikan ke dinas
- Koordinasi dengan komite sekolah
- Penjadwalan perbaikan bertahap',
        demo_user_id,
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days'
    );
    
    -- Jika ada admin user, buat juga data supervisi untuk admin
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.supervisions (
            id,
            title,
            school_id,
            date,
            principal_name,
            notes,
            user_id,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'Supervisi Koordinasi Pengawas',
            NULL,
            CURRENT_DATE - INTERVAL '1 day',
            'Koordinator Pengawas',
            'Supervisi koordinasi antar pengawas sekolah:

Agenda:
1. Evaluasi program supervisi bulan ini
2. Koordinasi jadwal supervisi
3. Sharing best practices
4. Perencanaan program bulan depan

Hasil:
- Semua pengawas aktif melaksanakan tugas
- Koordinasi berjalan baik
- Perlu standardisasi format laporan
- Program berjalan sesuai target

Tindak lanjut:
- Pembuatan template laporan standar
- Jadwal koordinasi rutin bulanan
- Evaluasi kinerja pengawas',
            admin_user_id,
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '1 day'
        );
    END IF;
    
    RAISE NOTICE 'Sample supervision data inserted successfully for user: %', demo_user_id;
    
END $$;

-- Verifikasi data yang sudah diinsert
SELECT 
    s.title,
    sc.name as school_name,
    s.date,
    s.principal_name,
    u.email as supervisor_email
FROM public.supervisions s
LEFT JOIN public.schools sc ON s.school_id = sc.id
LEFT JOIN public.users u ON s.user_id = u.id
ORDER BY s.date DESC;

SELECT 'Sample supervision data created successfully!' as status;
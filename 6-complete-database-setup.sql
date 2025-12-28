-- SCRIPT 6: Complete Database Setup (All-in-One)
-- Script ini menggabungkan semua perbaikan dan pembuatan tabel yang diperlukan

-- ========================================
-- PART 1: Fix Login Issues (Reset Passwords)
-- ========================================

-- Reset semua password user ke '123456' untuk memudahkan login
UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email IN ('pendemo@demo.com', 'pengawas@demo.com', 'admin@demo.com')
   OR email LIKE '%@demo.com'
   OR email LIKE '%test%@%';

-- Pastikan profile sync antara auth.users dan public.users
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
    CASE 
        WHEN au.email = 'pengawas@demo.com' THEN 'admin'
        WHEN au.email = 'admin@demo.com' THEN 'admin'
        ELSE 'user'
    END as role,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- ========================================
-- PART 2: Create Tasks Table
-- ========================================

-- Drop existing policies jika ada konflik
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can view all tasks" ON public.tasks;

-- Buat tabel tasks jika belum ada
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    activity_name VARCHAR NOT NULL,
    date DATE NOT NULL,
    location VARCHAR NOT NULL,
    organizer VARCHAR NOT NULL,
    description TEXT,
    photo_url_1 TEXT,
    photo_url_2 TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS untuk tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Buat RLS policies untuk tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Admin dapat melihat semua tasks
CREATE POLICY "Admin can view all tasks" ON public.tasks
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- PART 3: Create Supervisions Table
-- ========================================

-- Drop existing policies jika ada konflik
DROP POLICY IF EXISTS "Users can view own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can insert own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can update own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can delete own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Admin can view all supervisions" ON public.supervisions;

-- Buat tabel supervisions jika belum ada
CREATE TABLE IF NOT EXISTS public.supervisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    principal_name VARCHAR,
    notes TEXT NOT NULL,
    photo_url_1 TEXT,
    photo_url_2 TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS untuk supervisions table
ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;

-- Buat RLS policies untuk supervisions
CREATE POLICY "Users can view own supervisions" ON public.supervisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supervisions" ON public.supervisions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supervisions" ON public.supervisions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supervisions" ON public.supervisions
    FOR DELETE USING (auth.uid() = user_id);

-- Admin dapat melihat semua supervisions
CREATE POLICY "Admin can view all supervisions" ON public.supervisions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ========================================
-- PART 4: Create Triggers
-- ========================================

-- Buat trigger untuk updated_at (jika function sudah ada)
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_supervisions_updated_at ON public.supervisions;
CREATE TRIGGER update_supervisions_updated_at
    BEFORE UPDATE ON public.supervisions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- PART 5: Create Indexes
-- ========================================

-- Buat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);
CREATE INDEX IF NOT EXISTS idx_supervisions_user_id ON public.supervisions(user_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_date ON public.supervisions(date);
CREATE INDEX IF NOT EXISTS idx_supervisions_school_id ON public.supervisions(school_id);

-- ========================================
-- PART 6: Add Sample Data
-- ========================================

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
    
    -- Hapus data lama jika ada
    DELETE FROM public.tasks WHERE user_id = demo_user_id;
    DELETE FROM public.supervisions WHERE user_id = demo_user_id;
    
    -- Insert sample tasks data
    INSERT INTO public.tasks (
        id, activity_name, date, location, organizer, description, user_id, created_at, updated_at
    ) VALUES 
    (
        uuid_generate_v4(),
        'Workshop Kurikulum Merdeka',
        CURRENT_DATE + INTERVAL '7 days',
        'Aula Dinas Pendidikan',
        'Dinas Pendidikan Provinsi',
        'Workshop implementasi kurikulum merdeka untuk pengawas sekolah. Materi meliputi:
        
1. Konsep dasar kurikulum merdeka
2. Strategi implementasi di sekolah
3. Monitoring dan evaluasi
4. Best practices dari sekolah penggerak

Target peserta: Semua pengawas sekolah
Durasi: 2 hari (08.00-16.00)
Sertifikat: 30 JP',
        demo_user_id,
        NOW(),
        NOW()
    ),
    (
        uuid_generate_v4(),
        'Rapat Koordinasi Pengawas',
        CURRENT_DATE + INTERVAL '14 days',
        'Ruang Rapat Cabdin',
        'Kepala Cabang Dinas',
        'Rapat koordinasi bulanan pengawas sekolah membahas:

- Evaluasi program supervisi bulan ini
- Perencanaan program bulan depan  
- Koordinasi jadwal supervisi
- Sharing pengalaman dan best practices
- Update kebijakan terbaru dari pusat

Wajib hadir semua pengawas sekolah.',
        demo_user_id,
        NOW(),
        NOW()
    );
    
    -- Insert sample supervision data
    INSERT INTO public.supervisions (
        id, title, school_id, date, principal_name, notes, user_id, created_at, updated_at
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
        'Supervisi Manajemen Sekolah',
        school2_id,
        CURRENT_DATE - INTERVAL '14 days',
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
        NOW() - INTERVAL '14 days',
        NOW() - INTERVAL '14 days'
    );
    
    RAISE NOTICE 'Sample data inserted successfully for user: %', demo_user_id;
    
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Verifikasi tabel yang sudah dibuat
SELECT 'Database setup completed successfully!' as status;

SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('tasks', 'supervisions')
ORDER BY table_name;

SELECT 'Sample data summary:' as info;
SELECT 
    'Tasks' as table_name,
    COUNT(*) as record_count
FROM public.tasks
UNION ALL
SELECT 
    'Supervisions' as table_name,
    COUNT(*) as record_count
FROM public.supervisions
UNION ALL
SELECT 
    'Schools' as table_name,
    COUNT(*) as record_count
FROM public.schools
UNION ALL
SELECT 
    'Users' as table_name,
    COUNT(*) as record_count
FROM public.users;
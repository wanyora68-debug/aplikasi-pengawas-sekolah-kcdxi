-- SCRIPT 7: Safe Supervision Setup (Tidak akan error jika tabel sudah ada)
-- Script ini aman dijalankan meskipun beberapa tabel sudah ada

-- ========================================
-- PART 1: Create Supervisions Table (SAFE)
-- ========================================

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Users can view own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can insert own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can update own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can delete own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Admin can view all supervisions" ON public.supervisions;

-- Buat tabel supervisions jika belum ada (SAFE)
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
-- PART 2: Create Tasks Table (SAFE)
-- ========================================

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can view all tasks" ON public.tasks;

-- Buat tabel tasks jika belum ada (SAFE)
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
-- PART 3: Create Triggers (SAFE)
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
-- PART 4: Create Indexes (SAFE)
-- ========================================

-- Buat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);
CREATE INDEX IF NOT EXISTS idx_supervisions_user_id ON public.supervisions(user_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_date ON public.supervisions(date);
CREATE INDEX IF NOT EXISTS idx_supervisions_school_id ON public.supervisions(school_id);

-- ========================================
-- PART 5: Add Sample Data (SAFE)
-- ========================================

DO $$
DECLARE
    demo_user_id UUID;
    admin_user_id UUID;
    school1_id UUID;
    school2_id UUID;
BEGIN
    -- Cari user demo yang sudah ada
    SELECT id INTO demo_user_id FROM public.users WHERE email = 'pendemo@demo.com' LIMIT 1;
    SELECT id INTO admin_user_id FROM public.users WHERE email = 'pengawas@demo.com' LIMIT 1;
    
    -- Jika tidak ada user demo, gunakan user pertama yang ada
    IF demo_user_id IS NULL THEN
        SELECT id INTO demo_user_id FROM public.users ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Jika masih tidak ada user, skip sample data
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'No users found, skipping sample data creation';
        RETURN;
    END IF;
    
    -- Cari sekolah yang sudah ada
    SELECT id INTO school1_id FROM public.schools WHERE user_id = demo_user_id LIMIT 1;
    
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
        
        RAISE NOTICE 'Created sample school with ID: %', school1_id;
    END IF;
    
    -- Hapus data supervisi lama untuk user ini (jika ada)
    DELETE FROM public.supervisions WHERE user_id = demo_user_id;
    DELETE FROM public.tasks WHERE user_id = demo_user_id;
    
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
    );
    
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
    
    RAISE NOTICE 'Sample data created successfully for user: %', demo_user_id;
    
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Verifikasi tabel yang sudah dibuat
SELECT 'Safe supervision setup completed successfully!' as status;

SELECT 'Tables verified:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('tasks', 'supervisions', 'users', 'schools')
ORDER BY table_name;

SELECT 'Sample data summary:' as info;
SELECT 
    'Supervisions' as table_name,
    COUNT(*) as record_count
FROM public.supervisions
UNION ALL
SELECT 
    'Tasks' as table_name,
    COUNT(*) as record_count
FROM public.tasks
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
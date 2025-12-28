-- Fix Login Issue & Create Tasks Table
-- Jalankan script ini di Supabase SQL Editor

-- 1. Cek tabel yang ada
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Buat tabel tasks jika belum ada
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

-- 3. Enable RLS untuk tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. Buat RLS policies untuk tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Admin dapat melihat semua tasks
CREATE POLICY "Admin can view all tasks" ON public.tasks
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Buat trigger untuk updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Fix login issue - Reset password untuk semua user yang bermasalah
-- Update password untuk user yang sudah terdaftar tapi tidak bisa login
UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email IN (
    'wanyora68@gmail.com',
    'wanyora68+test1@gmail.com', 
    'wanyora68+simple@gmail.com',
    'wanyora68+neverfail@gmail.com'
);

-- 8. Pastikan semua user punya profile di public.users
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
    'user' as role,
    NOW() as created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Tambah sample data tasks untuk testing
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

-- 10. Verifikasi hasil
SELECT 'Setup completed successfully!' as status;
SELECT 'Users count:' as info, COUNT(*) as total FROM public.users;
SELECT 'Tasks count:' as info, COUNT(*) as total FROM public.tasks;
SELECT 'Tables created:' as info, table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'schools', 'activities', 'tasks');

-- 11. Test credentials yang bisa dipakai
SELECT 'LOGIN CREDENTIALS:' as info, email, 'Password: 123456' as password 
FROM public.users 
WHERE email IN ('pengawas@demo.com', 'wanyora68@gmail.com', 'wanyora68+test1@gmail.com')
ORDER BY email;
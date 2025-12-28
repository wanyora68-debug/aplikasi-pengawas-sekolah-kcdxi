-- Emergency Admin Fix - Direct Approach
-- Jalankan script ini di Supabase SQL Editor

-- 1. Hapus semua RLS policies yang mungkin blocking
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;

-- 2. Buat RLS policy yang sangat permissive untuk testing
CREATE POLICY "Allow all authenticated users" ON public.users
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Pastikan user demo ada dan bisa diakses
DELETE FROM public.users WHERE email = 'pengawas@demo.com';

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
    '550e8400-e29b-41d4-a716-446655440000',
    'pengawas@demo.com',
    'Wawan Yogaswara (Admin)',
    '196805301994121001',
    'Administrator Sistem',
    'Pembina Utama, IV/e',
    'Cabang Dinas Pendidikan Wilayah XI',
    'admin',
    NOW()
);

-- 4. Verifikasi
SELECT 'Emergency fix applied!' as status;
SELECT id, email, full_name, role FROM public.users WHERE email = 'pengawas@demo.com';
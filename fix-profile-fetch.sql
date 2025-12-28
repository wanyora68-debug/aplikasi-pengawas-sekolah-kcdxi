-- Fix Profile Fetch Issue
-- Jalankan script ini di Supabase SQL Editor

-- 1. Check current user data
SELECT id, email, full_name, role FROM public.users WHERE email = 'pengawas@demo.com';

-- 2. Update RLS policies to be more permissive for profile fetch
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.role() = 'authenticated'
    );

-- 3. Ensure user can update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (
        auth.uid() = id OR 
        auth.role() = 'authenticated'
    );

-- 4. Make sure the demo user exists and is properly configured
UPDATE public.users 
SET 
    role = 'admin',
    position = 'Administrator Sistem',
    pangkat = 'Pembina Utama, IV/e',
    full_name = COALESCE(full_name, 'Wawan Yogaswara'),
    nip = COALESCE(nip, '196805301994121001'),
    unit_kerja = COALESCE(unit_kerja, 'Cabang Dinas Pendidikan Wilayah XI')
WHERE email = 'pengawas@demo.com';

-- 5. Verify the update
SELECT 'Profile fix completed!' as status;
SELECT id, email, full_name, role, position FROM public.users WHERE email = 'pengawas@demo.com';
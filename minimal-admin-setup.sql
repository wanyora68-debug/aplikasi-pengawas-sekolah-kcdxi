-- Minimal Admin Setup - Only Essential Updates
-- Jalankan script ini di Supabase SQL Editor

-- 1. Update demo user to admin (ONLY this, no complex functions)
UPDATE public.users 
SET role = 'admin', 
    position = 'Administrator Sistem',
    pangkat = 'Pembina Utama, IV/e'
WHERE email = 'pengawas@demo.com';

-- 2. Simple RLS policy for admin (basic version)
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
CREATE POLICY "Admin can view all users" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. Verifikasi saja
SELECT 'Admin role updated!' as status;
SELECT email, full_name, role, position FROM public.users WHERE email = 'pengawas@demo.com';
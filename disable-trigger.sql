-- Disable Trigger Completely - Let App Handle Profile Creation
-- Jalankan script ini di Supabase SQL Editor

-- 1. Drop trigger completely to avoid any conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Ensure RLS policy allows profile creation on login
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.users;
CREATE POLICY "Allow all authenticated users" ON public.users
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Verifikasi
SELECT 'Trigger disabled - app will handle profile creation' as status;
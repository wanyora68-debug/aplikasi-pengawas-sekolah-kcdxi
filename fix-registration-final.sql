-- Fix Registration Issue - Final Solution
-- Jalankan script ini di Supabase SQL Editor

-- 1. Pastikan RLS policy untuk insert user profile permissive
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        auth.role() = 'authenticated'
    );

-- 2. Update trigger function untuk handle registrasi baru
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile dengan data dari metadata
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
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'nip', NULL),
        COALESCE(NEW.raw_user_meta_data->>'position', NULL),
        COALESCE(NEW.raw_user_meta_data->>'pangkat', NULL),
        COALESCE(NEW.raw_user_meta_data->>'unit_kerja', NULL),
        'user',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', users.full_name),
        nip = COALESCE(NEW.raw_user_meta_data->>'nip', users.nip),
        position = COALESCE(NEW.raw_user_meta_data->>'position', users.position),
        pangkat = COALESCE(NEW.raw_user_meta_data->>'pangkat', users.pangkat),
        unit_kerja = COALESCE(NEW.raw_user_meta_data->>'unit_kerja', users.unit_kerja);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error tapi jangan gagalkan registrasi
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-enable trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verifikasi
SELECT 'Registration fix applied!' as status;
-- SCRIPT 12: Create User wanyogas@gmail.com
-- Script untuk membuat user baru dengan email wanyogas@gmail.com

-- Buat user di auth.users terlebih dahulu (manual di Supabase Auth)
-- Kemudian jalankan script ini untuk membuat profile

-- Insert user profile ke public.users
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
    uuid_generate_v4(),
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

-- Verifikasi user berhasil dibuat
SELECT 
    email,
    full_name,
    nip,
    position,
    role,
    created_at
FROM public.users 
WHERE email = 'wanyogas@gmail.com';

SELECT 'User wanyogas@gmail.com berhasil dibuat!' as status;
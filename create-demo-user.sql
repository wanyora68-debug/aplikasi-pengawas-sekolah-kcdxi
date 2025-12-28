-- Script untuk membuat demo user di Supabase
-- Jalankan script ini di Supabase SQL Editor

-- 1. Buat user di auth.users (sistem authentication Supabase)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440000',
    'authenticated',
    'authenticated',
    'pengawas@demo.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Pengawas Demo"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- 2. Buat profile user di public.users
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
    'Pengawas Demo',
    '123456789',
    'Pengawas Sekolah',
    'Pembina, IV/a',
    'Cabang Dinas Pendidikan Wilayah XI',
    'user',
    NOW()
);

-- 3. Tambahkan beberapa data sample untuk demo
INSERT INTO public.schools (
    id,
    name,
    npsn,
    address,
    level,
    principal_name,
    user_id,
    created_at
) VALUES (
    uuid_generate_v4(),
    'SMA Negeri 1 Demo',
    '12345678',
    'Jl. Pendidikan No. 1, Kota Demo',
    'SMA',
    'Drs. Kepala Sekolah Demo',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW()
),
(
    uuid_generate_v4(),
    'SMK Negeri 2 Demo',
    '87654321',
    'Jl. Teknologi No. 2, Kota Demo',
    'SMK',
    'S.Pd. Kepala SMK Demo',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW()
);

-- Verifikasi data berhasil dibuat
SELECT 'Demo user created successfully!' as status;
SELECT email, full_name, position FROM public.users WHERE email = 'pengawas@demo.com';
SELECT name, level FROM public.schools WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
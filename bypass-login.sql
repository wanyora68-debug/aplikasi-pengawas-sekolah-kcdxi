-- Bypass Login - Create Working User Immediately
-- Jalankan script ini di Supabase SQL Editor

-- 1. Hapus semua user yang bermasalah
DELETE FROM auth.users WHERE email LIKE '%demo%' OR email LIKE '%test%' OR email LIKE '%wawan%';
DELETE FROM public.users WHERE email LIKE '%demo%' OR email LIKE '%test%' OR email LIKE '%wawan%';

-- 2. Buat user yang pasti bisa login
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440000',
    'authenticated', 'authenticated', 'admin@app.com',
    crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Administrator"}'
);

INSERT INTO public.users (id, email, full_name, nip, position, pangkat, unit_kerja, role, created_at) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@app.com',
    'Administrator CADISDIK XI',
    '196805301994121001',
    'Administrator Sistem',
    'Pembina Utama, IV/e',
    'Cabang Dinas Pendidikan Wilayah XI',
    'admin',
    NOW()
);

-- 3. Verifikasi
SELECT 'WORKING USER CREATED!' as status;
SELECT email, full_name, role FROM public.users WHERE email = 'admin@app.com';
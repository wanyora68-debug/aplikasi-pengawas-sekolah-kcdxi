-- Create Working Demo User - Immediate Solution
-- Jalankan script ini di Supabase SQL Editor

-- 1. Hapus user demo yang mungkin sudah ada tapi rusak
DELETE FROM auth.users WHERE email = 'pengawas@demo.com';
DELETE FROM public.users WHERE email = 'pengawas@demo.com';

-- 2. Disable trigger sementara untuk avoid konflik
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Insert auth user secara manual
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
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
    false,
    '',
    '',
    '',
    ''
);

-- 4. Insert profile user
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
    'Wawan Yogaswara',
    '196805301994121001',
    'Pengawas SMK',
    'Pembina Utama Muda, IV/c',
    'Cabang Dinas Pendidikan Wilayah XI',
    'user',
    NOW()
);

-- 5. Tambah sample data sekolah
INSERT INTO public.schools (
    id,
    name,
    npsn,
    address,
    level,
    principal_name,
    user_id,
    created_at
) VALUES 
(
    uuid_generate_v4(),
    'SMK Negeri 1 Karawang',
    '20228264',
    'Jl. Pangkal Perjuangan By Pass, Karawang',
    'SMK',
    'Drs. H. Asep Saepudin, M.Pd',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW()
),
(
    uuid_generate_v4(),
    'SMK Negeri 2 Karawang',
    '20228265',
    'Jl. Tuparev No. 123, Karawang',
    'SMK',
    'Dr. Siti Nurhaliza, S.Pd, M.M',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW()
),
(
    uuid_generate_v4(),
    'SMA Negeri 1 Karawang',
    '20228266',
    'Jl. Veteran No. 45, Karawang',
    'SMA',
    'Drs. Budi Santoso, M.Pd',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW()
);

-- 6. Tambah sample aktivitas
INSERT INTO public.activities (
    id,
    activity_name,
    category,
    date,
    accompaniment_type,
    duration_hours,
    notes,
    user_id,
    created_at,
    updated_at
) VALUES 
(
    uuid_generate_v4(),
    'Supervisi Akademik Pembelajaran',
    'Supervisi Akademik',
    '2024-12-20',
    'Supervisi Kelas',
    4,
    'Supervisi pembelajaran mata pelajaran produktif di SMK Negeri 1 Karawang',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Monitoring Kurikulum Merdeka',
    'Supervisi Manajerial',
    '2024-12-18',
    'Monitoring',
    3,
    'Monitoring implementasi Kurikulum Merdeka di seluruh SMK binaan',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Pembinaan Guru Produktif',
    'Pembinaan',
    '2024-12-15',
    'Workshop',
    6,
    'Workshop peningkatan kompetensi guru mata pelajaran produktif',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW(),
    NOW()
);

-- 7. Tambah sample tugas
INSERT INTO public.tasks (
    id,
    activity_name,
    date,
    location,
    organizer,
    description,
    user_id,
    created_at,
    updated_at
) VALUES 
(
    uuid_generate_v4(),
    'Rapat Koordinasi Pengawas',
    '2024-12-30',
    'Kantor Cabang Dinas Pendidikan Wilayah XI',
    'Cabang Dinas Pendidikan',
    'Rapat koordinasi bulanan pengawas sekolah untuk evaluasi program kerja',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Verifikasi Akreditasi Sekolah',
    '2025-01-05',
    'SMK Negeri 3 Karawang',
    'BAN-S/M',
    'Verifikasi dokumen dan visitasi untuk akreditasi sekolah',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW(),
    NOW()
);

-- 8. Re-enable trigger dengan function yang lebih simple
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Hanya insert jika belum ada
    INSERT INTO public.users (id, email, full_name, role, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        'user',
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors, jangan gagalkan auth
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Verifikasi
SELECT 'Demo user created successfully!' as status;
SELECT email, full_name, position, nip FROM public.users WHERE email = 'pengawas@demo.com';
SELECT COUNT(*) as total_schools FROM public.schools WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT COUNT(*) as total_activities FROM public.activities WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT COUNT(*) as total_tasks FROM public.tasks WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
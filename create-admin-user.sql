-- Create Admin User with Full Access
-- Jalankan script ini di Supabase SQL Editor

-- 1. Create admin auth user
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
    '550e8400-e29b-41d4-a716-446655440001',
    'authenticated',
    'authenticated',
    'admin@cadisdik11.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Administrator CADISDIK XI"}',
    false,
    '',
    '',
    '',
    ''
);

-- 2. Create admin profile
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
    '550e8400-e29b-41d4-a716-446655440001',
    'admin@cadisdik11.com',
    'Administrator CADISDIK XI',
    '198001011999031001',
    'Administrator Sistem',
    'Pembina Utama, IV/e',
    'Cabang Dinas Pendidikan Wilayah XI',
    'admin',
    NOW()
);

-- 3. Update RLS policies untuk admin access
-- Admin dapat melihat semua data users
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
CREATE POLICY "Admin can view all users" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin dapat melihat semua sekolah
DROP POLICY IF EXISTS "Admin can view all schools" ON public.schools;
CREATE POLICY "Admin can view all schools" ON public.schools
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin dapat melihat semua aktivitas
DROP POLICY IF EXISTS "Admin can view all activities" ON public.activities;
CREATE POLICY "Admin can view all activities" ON public.activities
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin dapat melihat semua tugas
DROP POLICY IF EXISTS "Admin can view all tasks" ON public.tasks;
CREATE POLICY "Admin can view all tasks" ON public.tasks
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin dapat update/delete semua data
DROP POLICY IF EXISTS "Admin can manage all schools" ON public.schools;
CREATE POLICY "Admin can manage all schools" ON public.schools
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admin can manage all activities" ON public.activities;
CREATE POLICY "Admin can manage all activities" ON public.activities
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admin can manage all tasks" ON public.tasks;
CREATE POLICY "Admin can manage all tasks" ON public.tasks
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Create admin statistics view
CREATE OR REPLACE VIEW admin_statistics AS
SELECT 
    'total_users' as metric,
    COUNT(*)::text as value,
    'Total Pengawas Terdaftar' as label
FROM public.users WHERE role = 'user'
UNION ALL
SELECT 
    'total_schools' as metric,
    COUNT(*)::text as value,
    'Total Sekolah Binaan' as label
FROM public.schools
UNION ALL
SELECT 
    'total_activities' as metric,
    COUNT(*)::text as value,
    'Total Aktivitas Supervisi' as label
FROM public.activities
UNION ALL
SELECT 
    'total_tasks' as metric,
    COUNT(*)::text as value,
    'Total Tugas/Kegiatan' as label
FROM public.tasks
UNION ALL
SELECT 
    'activities_this_month' as metric,
    COUNT(*)::text as value,
    'Aktivitas Bulan Ini' as label
FROM public.activities 
WHERE DATE_TRUNC('month', date::date) = DATE_TRUNC('month', CURRENT_DATE)
UNION ALL
SELECT 
    'active_users' as metric,
    COUNT(DISTINCT user_id)::text as value,
    'Pengawas Aktif Bulan Ini' as label
FROM public.activities 
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);

-- Grant access to admin view
GRANT SELECT ON admin_statistics TO authenticated;

-- 5. Create function untuk admin reports
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    total_schools BIGINT,
    total_activities BIGINT,
    total_tasks BIGINT,
    last_activity_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.full_name as user_name,
        u.email as user_email,
        COALESCE(s.school_count, 0) as total_schools,
        COALESCE(a.activity_count, 0) as total_activities,
        COALESCE(t.task_count, 0) as total_tasks,
        GREATEST(
            COALESCE(a.last_activity, '1900-01-01'::date),
            COALESCE(t.last_task, '1900-01-01'::date)
        ) as last_activity_date
    FROM public.users u
    LEFT JOIN (
        SELECT user_id, COUNT(*) as school_count
        FROM public.schools
        GROUP BY user_id
    ) s ON u.id = s.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as activity_count, MAX(date::date) as last_activity
        FROM public.activities
        GROUP BY user_id
    ) a ON u.id = a.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as task_count, MAX(date::date) as last_task
        FROM public.tasks
        GROUP BY user_id
    ) t ON u.id = t.user_id
    WHERE u.role = 'user'
    AND (user_id_param IS NULL OR u.id = user_id_param)
    ORDER BY u.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_activity_summary TO authenticated;

-- 6. Tambah sample data untuk admin testing
-- Buat beberapa user pengawas dummy untuk testing admin
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440002',
    'authenticated', 'authenticated', 'pengawas1@demo.com',
    crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Drs. Ahmad Suryadi"}'
),
(
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440003',
    'authenticated', 'authenticated', 'pengawas2@demo.com',
    crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Dr. Siti Rahayu, M.Pd"}'
);

INSERT INTO public.users (id, email, full_name, nip, position, pangkat, unit_kerja, role, created_at) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    'pengawas1@demo.com',
    'Drs. Ahmad Suryadi',
    '196505151990031002',
    'Pengawas SMA',
    'Pembina, IV/a',
    'Cabang Dinas Pendidikan Wilayah XI',
    'user',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'pengawas2@demo.com',
    'Dr. Siti Rahayu, M.Pd',
    '197203101998032001',
    'Pengawas SMP',
    'Pembina Tingkat I, IV/b',
    'Cabang Dinas Pendidikan Wilayah XI',
    'user',
    NOW()
);

-- 7. Verifikasi admin user
SELECT 'Admin user created successfully!' as status;
SELECT email, full_name, role, position FROM public.users WHERE role = 'admin';
SELECT COUNT(*) as total_users FROM public.users WHERE role = 'user';

-- 8. Test admin functions
SELECT * FROM admin_statistics;
SELECT * FROM get_user_activity_summary() LIMIT 5;
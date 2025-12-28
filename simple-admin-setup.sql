-- Simple Admin Setup - Minimal Approach
-- Jalankan script ini di Supabase SQL Editor

-- 1. Update existing demo user to admin (simplest approach)
UPDATE public.users 
SET role = 'admin', 
    position = 'Administrator Sistem',
    pangkat = 'Pembina Utama, IV/e'
WHERE email = 'pengawas@demo.com';

-- 2. Create simple admin statistics view
DROP VIEW IF EXISTS admin_statistics;
CREATE VIEW admin_statistics AS
SELECT 
    'total_users' as metric,
    COUNT(*)::text as value
FROM public.users WHERE role = 'user'
UNION ALL
SELECT 
    'total_schools' as metric,
    COUNT(*)::text as value
FROM public.schools
UNION ALL
SELECT 
    'total_activities' as metric,
    COUNT(*)::text as value
FROM public.activities
UNION ALL
SELECT 
    'total_tasks' as metric,
    COUNT(*)::text as value
FROM public.tasks;

-- Grant access
GRANT SELECT ON admin_statistics TO authenticated;

-- 3. Create simple user summary function
DROP FUNCTION IF EXISTS get_user_activity_summary();
CREATE OR REPLACE FUNCTION get_user_activity_summary()
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    total_schools BIGINT,
    total_activities BIGINT,
    total_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.full_name,
        u.email,
        (SELECT COUNT(*) FROM public.schools s WHERE s.user_id = u.id),
        (SELECT COUNT(*) FROM public.activities a WHERE a.user_id = u.id),
        (SELECT COUNT(*) FROM public.tasks t WHERE t.user_id = u.id)
    FROM public.users u
    WHERE u.role = 'user'
    ORDER BY u.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_activity_summary TO authenticated;

-- 4. Update RLS policies for admin (simple version)
-- Drop existing admin policies if any
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can view all schools" ON public.schools;
DROP POLICY IF EXISTS "Admin can view all activities" ON public.activities;
DROP POLICY IF EXISTS "Admin can view all tasks" ON public.tasks;

-- Create new admin policies
CREATE POLICY "Admin can view all users" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can view all schools" ON public.schools
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can view all activities" ON public.activities
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can view all tasks" ON public.tasks
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Verifikasi
SELECT 'Admin setup completed!' as status;
SELECT email, full_name, role, position FROM public.users WHERE email = 'pengawas@demo.com';

-- Test functions
SELECT * FROM admin_statistics;
SELECT user_name, total_schools, total_activities, total_tasks FROM get_user_activity_summary() LIMIT 3;
-- SCRIPT 19: Fix Activities RLS Policies
-- Jalankan jika aktivitas tidak muncul di dashboard/laporan

-- Cek RLS policies yang ada untuk activities
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'activities';

-- Drop semua policies lama
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON public.activities;
DROP POLICY IF EXISTS "Admin can view all activities" ON public.activities;

-- Buat ulang policies yang benar
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON public.activities
    FOR DELETE USING (auth.uid() = user_id);

-- Verifikasi
SELECT 'Activities RLS policies fixed!' as status;

-- Test: hitung aktivitas per user
SELECT 
    u.email,
    COUNT(a.id) as total_activities
FROM public.users u
LEFT JOIN public.activities a ON u.id = a.user_id
GROUP BY u.id, u.email
ORDER BY total_activities DESC;
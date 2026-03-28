-- SCRIPT 20: Fix Activities Access Issue
-- Jalankan script ini di Supabase SQL Editor

-- STEP 1: Cek data aktivitas yang ada
SELECT 
    a.id,
    a.activity_name,
    a.category,
    a.date,
    a.user_id,
    u.email
FROM public.activities a
LEFT JOIN public.users u ON a.user_id = u.id
ORDER BY a.date DESC
LIMIT 10;

-- STEP 2: Cek RLS policies untuk activities
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'activities';

-- STEP 3: Cek apakah RLS aktif
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'activities';

-- STEP 4: Fix - Drop semua policies lama dan buat ulang
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON public.activities;
DROP POLICY IF EXISTS "Admin can view all activities" ON public.activities;

-- Buat policy baru yang benar
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON public.activities
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 5: Verifikasi
SELECT 'Activities RLS fixed!' as status;
SELECT COUNT(*) as total_activities FROM public.activities;
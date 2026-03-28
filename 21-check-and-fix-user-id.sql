-- SCRIPT 21: Check and Fix User ID Mismatch
-- Jalankan di Supabase SQL Editor

-- STEP 1: Lihat semua user di auth.users dan public.users
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    pu.id as profile_id,
    pu.email as profile_email,
    CASE WHEN au.id = pu.id THEN 'MATCH' ELSE 'MISMATCH' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
ORDER BY au.created_at DESC;

-- STEP 2: Lihat aktivitas dan user_id-nya
SELECT 
    a.activity_name,
    a.category,
    a.date,
    a.user_id,
    u.email,
    au.email as auth_email
FROM public.activities a
LEFT JOIN public.users u ON a.user_id = u.id
LEFT JOIN auth.users au ON a.user_id = au.id
ORDER BY a.date DESC
LIMIT 10;

-- STEP 3: Hitung aktivitas per user
SELECT 
    COALESCE(u.email, 'NO PROFILE') as email,
    a.user_id,
    COUNT(*) as count
FROM public.activities a
LEFT JOIN public.users u ON a.user_id = u.id
GROUP BY a.user_id, u.email
ORDER BY count DESC;
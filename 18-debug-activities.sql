-- SCRIPT 18: Debug Activities Data
-- Jalankan di Supabase SQL Editor untuk cek data aktivitas

-- Cek semua user yang ada
SELECT id, email, full_name FROM public.users ORDER BY created_at;

-- Cek semua aktivitas dan user_id-nya
SELECT 
    a.id,
    a.activity_name,
    a.category,
    a.date,
    a.user_id,
    u.email as user_email
FROM public.activities a
LEFT JOIN public.users u ON a.user_id = u.id
ORDER BY a.date DESC
LIMIT 20;

-- Hitung aktivitas per user
SELECT 
    u.email,
    COUNT(a.id) as total_activities
FROM public.users u
LEFT JOIN public.activities a ON u.id = a.user_id
GROUP BY u.id, u.email
ORDER BY total_activities DESC;
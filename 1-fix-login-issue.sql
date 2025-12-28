-- SCRIPT 1: Fix Login Issue
-- Jalankan script ini dulu di Supabase SQL Editor

-- Reset password untuk semua user yang bermasalah jadi '123456'
UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email IN (
    'wanyora68@gmail.com',
    'wanyora68+test1@gmail.com', 
    'wanyora68+simple@gmail.com',
    'wanyora68+neverfail@gmail.com',
    'pengawas@demo.com'
);

-- Pastikan semua user punya profile di public.users
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
    'user' as role,
    NOW() as created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verifikasi hasil
SELECT 'Login fix completed!' as status;
SELECT 'LOGIN CREDENTIALS (Password: 123456):' as info, email 
FROM public.users 
WHERE email IN ('pengawas@demo.com', 'wanyora68@gmail.com', 'wanyora68+test1@gmail.com')
ORDER BY email;
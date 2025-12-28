-- SCRIPT 10: Add Sample Data Only
-- Tambah data contoh setelah tabel berhasil dibuat

-- Cari user yang sudah ada
DO $$
DECLARE
    demo_user_id UUID;
    school_id UUID;
BEGIN
    -- Ambil user pertama yang ada
    SELECT id INTO demo_user_id FROM public.users LIMIT 1;
    
    -- Jika tidak ada user, skip
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'No users found, cannot create sample data';
        RETURN;
    END IF;
    
    -- Ambil sekolah pertama untuk user ini
    SELECT id INTO school_id FROM public.schools WHERE user_id = demo_user_id LIMIT 1;
    
    -- Insert sample supervision
    INSERT INTO public.supervisions (
        title, school_id, date, principal_name, notes, user_id
    ) VALUES (
        'Supervisi Pembelajaran Contoh',
        school_id,
        CURRENT_DATE - INTERVAL '7 days',
        'Kepala Sekolah',
        'Hasil supervisi pembelajaran menunjukkan kemajuan yang baik. Guru sudah menerapkan metode pembelajaran yang sesuai dengan kurikulum.',
        demo_user_id
    );
    
    -- Insert sample task
    INSERT INTO public.tasks (
        activity_name, date, location, organizer, description, user_id
    ) VALUES (
        'Workshop Pengawas Sekolah',
        CURRENT_DATE + INTERVAL '7 days',
        'Aula Dinas Pendidikan',
        'Dinas Pendidikan',
        'Workshop peningkatan kompetensi pengawas sekolah dalam melaksanakan supervisi.',
        demo_user_id
    );
    
    RAISE NOTICE 'Sample data created for user: %', demo_user_id;
END $$;

SELECT 'Sample data added successfully!' as result;
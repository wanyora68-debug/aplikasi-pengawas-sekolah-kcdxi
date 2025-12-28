-- SCRIPT 4: Create Supervision Table (Dedicated Supervision Table)
-- Jalankan script ini untuk membuat tabel supervisi yang terpisah

-- Drop existing policies jika ada konflik
DROP POLICY IF EXISTS "Users can view own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can insert own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can update own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Users can delete own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Admin can view all supervisions" ON public.supervisions;

-- Buat tabel supervisions jika belum ada
CREATE TABLE IF NOT EXISTS public.supervisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    principal_name VARCHAR,
    notes TEXT NOT NULL,
    photo_url_1 TEXT,
    photo_url_2 TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS untuk supervisions table
ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;

-- Buat RLS policies baru
CREATE POLICY "Users can view own supervisions" ON public.supervisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supervisions" ON public.supervisions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supervisions" ON public.supervisions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supervisions" ON public.supervisions
    FOR DELETE USING (auth.uid() = user_id);

-- Admin dapat melihat semua supervisions
CREATE POLICY "Admin can view all supervisions" ON public.supervisions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Buat trigger untuk updated_at (jika function sudah ada)
DROP TRIGGER IF EXISTS update_supervisions_updated_at ON public.supervisions;
CREATE TRIGGER update_supervisions_updated_at
    BEFORE UPDATE ON public.supervisions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Buat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_supervisions_user_id ON public.supervisions(user_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_date ON public.supervisions(date);
CREATE INDEX IF NOT EXISTS idx_supervisions_school_id ON public.supervisions(school_id);

-- Verifikasi
SELECT 'Supervisions table created successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'supervisions';

-- Tampilkan struktur tabel
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'supervisions'
ORDER BY ordinal_position;
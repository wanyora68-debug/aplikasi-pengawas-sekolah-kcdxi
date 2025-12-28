-- SCRIPT 8: Minimal Supervision Table Creation Only
-- Script paling sederhana untuk membuat tabel supervisions saja

-- Buat tabel supervisions
CREATE TABLE public.supervisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR NOT NULL,
    school_id UUID,
    date DATE NOT NULL,
    principal_name VARCHAR,
    notes TEXT NOT NULL,
    photo_url_1 TEXT,
    photo_url_2 TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view own supervisions" ON public.supervisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supervisions" ON public.supervisions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supervisions" ON public.supervisions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supervisions" ON public.supervisions
    FOR DELETE USING (auth.uid() = user_id);

-- Basic index
CREATE INDEX idx_supervisions_user_id ON public.supervisions(user_id);

-- Verifikasi sederhana
SELECT 'Supervisions table created successfully!' as result;
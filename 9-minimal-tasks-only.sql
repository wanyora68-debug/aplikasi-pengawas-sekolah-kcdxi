-- SCRIPT 9: Minimal Tasks Table Creation Only
-- Script paling sederhana untuk membuat tabel tasks saja

-- Buat tabel tasks
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    activity_name VARCHAR NOT NULL,
    date DATE NOT NULL,
    location VARCHAR NOT NULL,
    organizer VARCHAR NOT NULL,
    description TEXT,
    photo_url_1 TEXT,
    photo_url_2 TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Basic index
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);

-- Verifikasi sederhana
SELECT 'Tasks table created successfully!' as result;
-- Supabase Database Schema for Aplikasi Pengawas Sekolah KCDXI
-- Execute this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    full_name VARCHAR NOT NULL,
    nip VARCHAR,
    position VARCHAR,
    pangkat VARCHAR,
    unit_kerja VARCHAR,
    profile_photo TEXT,
    role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools table
CREATE TABLE public.schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    npsn VARCHAR,
    address TEXT,
    level VARCHAR CHECK (level IN ('SLB', 'SMA', 'SMK')),
    principal_name VARCHAR,
    photo_url_1 TEXT,
    photo_url_2 TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE public.activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    activity_name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    accompaniment_type VARCHAR,
    duration_hours INTEGER,
    notes TEXT,
    document_url TEXT,
    photo_url_1 TEXT,
    photo_url_2 TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    activity_name VARCHAR NOT NULL,
    date DATE NOT NULL,
    location VARCHAR NOT NULL,
    organizer VARCHAR NOT NULL,
    description TEXT,
    photo_url_1 TEXT,
    photo_url_2 TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supervisions table (dedicated supervision table)
CREATE TABLE public.supervisions (
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

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Schools policies
CREATE POLICY "Users can view own schools" ON public.schools
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schools" ON public.schools
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schools" ON public.schools
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schools" ON public.schools
    FOR DELETE USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON public.activities
    FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Supervisions policies
CREATE POLICY "Users can view own supervisions" ON public.supervisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supervisions" ON public.supervisions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supervisions" ON public.supervisions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supervisions" ON public.supervisions
    FOR DELETE USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to automatically create user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supervisions_updated_at
    BEFORE UPDATE ON public.supervisions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for photos (run this in Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage policies for photos bucket
-- CREATE POLICY "Users can upload photos" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can view photos" ON storage.objects
--     FOR SELECT USING (bucket_id = 'photos');

-- CREATE POLICY "Users can update own photos" ON storage.objects
--     FOR UPDATE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own photos" ON storage.objects
--     FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes for better performance
CREATE INDEX idx_schools_user_id ON public.schools(user_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_date ON public.activities(date);
CREATE INDEX idx_activities_category ON public.activities(category);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_date ON public.tasks(date);
CREATE INDEX idx_supervisions_user_id ON public.supervisions(user_id);
CREATE INDEX idx_supervisions_date ON public.supervisions(date);
CREATE INDEX idx_supervisions_school_id ON public.supervisions(school_id);

-- Sample data (optional - for testing)
-- You can uncomment this after setting up your first user

-- INSERT INTO public.users (id, email, full_name, nip, position, pangkat, unit_kerja, role) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'pengawas@demo.com', 'Pengawas Demo', '123456789', 'Pengawas Sekolah', 'Pembina, IV/a', 'Cabang Dinas Pendidikan Wilayah XI', 'user'),
-- ('550e8400-e29b-41d4-a716-446655440001', 'admin@demo.com', 'Admin Demo', '987654321', 'Administrator', 'Pembina Utama, IV/e', 'Cabang Dinas Pendidikan Wilayah XI', 'admin');

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.schools IS 'Schools managed by supervisors';
COMMENT ON TABLE public.activities IS 'Supervision activities and accompaniment';
COMMENT ON TABLE public.tasks IS 'Additional tasks and assignments';
COMMENT ON TABLE public.supervisions IS 'Dedicated supervision records';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
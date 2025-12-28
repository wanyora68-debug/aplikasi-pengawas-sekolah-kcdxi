-- SCRIPT 11: Fix Existing Tasks Table
-- Perbaiki tabel tasks yang sudah ada

-- Drop existing policies untuk tasks (jika ada)
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can view all tasks" ON public.tasks;

-- Enable RLS untuk tasks (jika belum)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Buat policies baru untuk tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Buat index jika belum ada
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);

-- Verifikasi
SELECT 'Tasks table policies updated successfully!' as result;
-- Create dsa_problems table
CREATE TABLE IF NOT EXISTS public.dsa_problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    pattern TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
    status TEXT CHECK (status IN ('Todo', 'In Progress', 'Done', 'Revisit')) DEFAULT 'Todo' NOT NULL,
    lc_url TEXT NOT NULL,
    nc_url TEXT NOT NULL,
    notes TEXT DEFAULT '' NOT NULL,
    solved_date TIMESTAMPTZ,
    revisit_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create sql_problems table
CREATE TABLE IF NOT EXISTS public.sql_problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    concept TEXT NOT NULL,
    phase INTEGER CHECK (phase IN (1, 2, 3, 4)) NOT NULL,
    status TEXT CHECK (status IN ('Todo', 'In Progress', 'Done', 'Revisit')) DEFAULT 'Todo' NOT NULL,
    lc_url TEXT NOT NULL,
    my_solution TEXT DEFAULT '' NOT NULL,
    notes TEXT DEFAULT '' NOT NULL,
    solved_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create daily_logs table
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_date DATE UNIQUE NOT NULL,
    energy INTEGER CHECK (energy >= 1 AND energy <= 10) DEFAULT 5 NOT NULL,
    tasks JSONB DEFAULT '[]'::jsonb NOT NULL,
    learned_today TEXT DEFAULT '' NOT NULL,
    dsa_solved INTEGER DEFAULT 0 NOT NULL,
    sql_solved INTEGER DEFAULT 0 NOT NULL,
    github_committed BOOLEAN DEFAULT FALSE NOT NULL,
    x_posted BOOLEAN DEFAULT FALSE NOT NULL,
    project_progress TEXT DEFAULT '' NOT NULL,
    tomorrow_task TEXT DEFAULT '' NOT NULL,
    mood TEXT DEFAULT '' NOT NULL,
    steps INTEGER DEFAULT 0 NOT NULL,
    water INTEGER CHECK (water >= 0 AND water <= 8) DEFAULT 0 NOT NULL,
    sleep_hours NUMERIC DEFAULT 0 NOT NULL,
    workout BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    stack_tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    status TEXT CHECK (status IN ('Live', 'Building', 'Paused', 'Idea')) DEFAULT 'Idea' NOT NULL,
    live_url TEXT,
    github_url TEXT,
    resume_variant TEXT[] DEFAULT '{}'::text[] NOT NULL,
    next_task TEXT DEFAULT '' NOT NULL,
    progress_pct INTEGER DEFAULT 0 NOT NULL,
    notes TEXT DEFAULT '' NOT NULL,
    interview_script TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create metrics table
CREATE TABLE IF NOT EXISTS public.metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_key TEXT UNIQUE NOT NULL,
    metric_name TEXT NOT NULL,
    icon TEXT NOT NULL,
    current_value INTEGER DEFAULT 0 NOT NULL,
    target_value INTEGER NOT NULL,
    unit TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create quick_links table
CREATE TABLE IF NOT EXISTS public.quick_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    position INTEGER NOT NULL,
    category TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.dsa_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sql_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated (Using a wildcard policy since this is a personal app for 1 user)
-- For simplicity in a personal app without strict multi-tenant roles:
CREATE POLICY "Allow all for authenticated users" ON public.dsa_problems FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.sql_problems FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.daily_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.quick_links FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- DEX v2.0 — Jobs Intelligence Tables
-- Migration: 002_jobs_tables.sql
-- ============================================================

-- TABLE: dex_jobs
-- Stores scraped job listings with AI match scores
CREATE TABLE IF NOT EXISTS dex_jobs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text NOT NULL,
    company         text NOT NULL,
    location        text,
    job_type        text,  -- remote / onsite / hybrid
    source          text,  -- linkedin / naukri / indeed / glassdoor
    url             text UNIQUE,
    description     text,
    posted_at       timestamp,
    match_score     integer CHECK (match_score >= 0 AND match_score <= 100),
    is_saved        boolean DEFAULT false,
    is_hidden       boolean DEFAULT false,
    scraped_at      timestamp DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dex_jobs_match_score ON dex_jobs(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_dex_jobs_posted_at ON dex_jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_dex_jobs_source ON dex_jobs(source);
CREATE INDEX IF NOT EXISTS idx_dex_jobs_company ON dex_jobs(company);
CREATE INDEX IF NOT EXISTS idx_dex_jobs_is_hidden ON dex_jobs(is_hidden);
CREATE INDEX IF NOT EXISTS idx_dex_jobs_is_saved ON dex_jobs(is_saved);

-- ============================================================

-- TABLE: dex_applications
-- Tracks job applications with status pipeline
CREATE TABLE IF NOT EXISTS dex_applications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company         text NOT NULL,
    role            text NOT NULL,
    status          text DEFAULT 'Applied'
                    CHECK (status IN ('Applied', 'OA Received', 'Interview Scheduled',
                                      'Interview Done', 'Offer', 'Rejected', 'Ghosted')),
    applied_date    date DEFAULT CURRENT_DATE,
    deadline        date,
    job_url         text,
    notes           text,
    logo_url        text,
    intel_cached    boolean DEFAULT false,
    created_at      timestamp DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dex_applications_status ON dex_applications(status);
CREATE INDEX IF NOT EXISTS idx_dex_applications_applied_date ON dex_applications(applied_date DESC);
CREATE INDEX IF NOT EXISTS idx_dex_applications_deadline ON dex_applications(deadline);

-- ============================================================

-- TABLE: dex_company_intel
-- Caches AI-generated company intelligence reports
CREATE TABLE IF NOT EXISTS dex_company_intel (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name        text UNIQUE NOT NULL,
    overview            jsonb,    -- {name, industry, founded, hq, employees, products}
    tech_stack          text[],   -- array of technologies seen in JDs
    top_skills          text[],   -- top 5 skills they require
    interview_qs        jsonb,    -- array of {question, source, difficulty}
    interview_process   text,     -- step-by-step process description
    glassdoor_rating    decimal(2,1),
    culture_summary     text,
    salary_range        text,
    why_company_ans     text,     -- Gemini-generated "Why this company?" answer
    tell_me_about       text,     -- Gemini "Tell me about yourself" tailored answer
    fit_score           integer CHECK (fit_score >= 0 AND fit_score <= 100),
    fit_highlights      text[],   -- top 3 things to mention
    fit_gaps            text[],   -- top 2 things to prepare
    last_scraped        timestamp DEFAULT now(),
    cache_valid         boolean DEFAULT true
);

-- Index for fast lookups by company name
CREATE INDEX IF NOT EXISTS idx_dex_company_intel_name ON dex_company_intel(company_name);
CREATE INDEX IF NOT EXISTS idx_dex_company_intel_last_scraped ON dex_company_intel(last_scraped DESC);

-- ============================================================
-- Enable Row Level Security (optional — DEX is personal-use)
-- Uncomment if you want RLS enabled:
-- ALTER TABLE dex_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dex_applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dex_company_intel ENABLE ROW LEVEL SECURITY;

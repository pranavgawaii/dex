export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            dsa_problems: {
                Row: {
                    id: string;
                    number: number;
                    title: string;
                    pattern: string;
                    difficulty: "Easy" | "Medium" | "Hard";
                    status: "Todo" | "In Progress" | "Done" | "Revisit";
                    lc_url: string;
                    nc_url: string;
                    notes: string;
                    solved_date: string | null;
                    revisit_date: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["dsa_problems"]["Row"], "id" | "created_at"> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["dsa_problems"]["Insert"]>;
            };
            sql_problems: {
                Row: {
                    id: string;
                    number: number;
                    title: string;
                    concept: string;
                    phase: 1 | 2 | 3 | 4;
                    difficulty: "Easy" | "Medium" | "Hard";
                    status: "Todo" | "In Progress" | "Done" | "Revisit";
                    lc_url: string;
                    my_solution: string;
                    notes: string;
                    solved_date: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["sql_problems"]["Row"], "id" | "created_at"> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["sql_problems"]["Insert"]>;
            };
            daily_logs: {
                Row: {
                    id: string;
                    log_date: string;
                    energy: number;
                    tasks: { text: string; done: boolean; description: string }[];
                    learned_today: string;
                    dsa_solved: number;
                    sql_solved: number;
                    github_committed: boolean;
                    x_posted: boolean;
                    project_progress: string;
                    tomorrow_task: string;
                    mood: string;
                    steps: number;
                    water: number;
                    sleep_hours: number;
                    workout: boolean;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["daily_logs"]["Row"], "id" | "created_at"> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["daily_logs"]["Insert"]>;
            };
            projects: {
                Row: {
                    id: string;
                    name: string;
                    emoji: string;
                    description: string;
                    stack_tags: string[];
                    status: "Live" | "Building" | "Paused" | "Idea";
                    live_url: string | null;
                    github_url: string | null;
                    resume_variant: string[];
                    next_task: string;
                    progress_pct: number;
                    notes: string;
                    interview_script: string;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at"> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
            };
            metrics: {
                Row: {
                    id: string;
                    metric_key: string;
                    metric_name: string;
                    icon: string;
                    current_value: number;
                    target_value: number;
                    unit: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["metrics"]["Row"], "id" | "updated_at"> & {
                    id?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["metrics"]["Insert"]>;
            };
            quick_links: {
                Row: {
                    id: string;
                    label: string;
                    url: string;
                    icon_name: string;
                    position: number;
                    category: string;
                };
                Insert: Omit<Database["public"]["Tables"]["quick_links"]["Row"], "id"> & { id?: string };
                Update: Partial<Database["public"]["Tables"]["quick_links"]["Insert"]>;
            };
            dex_jobs: {
                Row: {
                    id: string;
                    title: string;
                    company: string;
                    location: string | null;
                    job_type: string | null;
                    source: string | null;
                    url: string | null;
                    description: string | null;
                    posted_at: string | null;
                    match_score: number | null;
                    is_saved: boolean;
                    is_hidden: boolean;
                    scraped_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["dex_jobs"]["Row"], "id" | "scraped_at"> & {
                    id?: string;
                    scraped_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["dex_jobs"]["Insert"]>;
            };
            dex_applications: {
                Row: {
                    id: string;
                    company: string;
                    role: string;
                    status: 'Applied' | 'OA Received' | 'Interview Scheduled' | 'Interview Done' | 'Offer' | 'Rejected' | 'Ghosted';
                    applied_date: string;
                    deadline: string | null;
                    job_url: string | null;
                    notes: string | null;
                    logo_url: string | null;
                    intel_cached: boolean;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["dex_applications"]["Row"], "id" | "created_at"> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["dex_applications"]["Insert"]>;
            };
            dex_company_intel: {
                Row: {
                    id: string;
                    company_name: string;
                    overview: Json | null;
                    tech_stack: string[] | null;
                    top_skills: string[] | null;
                    interview_qs: Json | null;
                    interview_process: string | null;
                    glassdoor_rating: number | null;
                    culture_summary: string | null;
                    salary_range: string | null;
                    why_company_ans: string | null;
                    tell_me_about: string | null;
                    fit_score: number | null;
                    fit_highlights: string[] | null;
                    fit_gaps: string[] | null;
                    last_scraped: string;
                    cache_valid: boolean;
                };
                Insert: Omit<Database["public"]["Tables"]["dex_company_intel"]["Row"], "id" | "last_scraped"> & {
                    id?: string;
                    last_scraped?: string;
                };
                Update: Partial<Database["public"]["Tables"]["dex_company_intel"]["Insert"]>;
            };
        };
    };
}

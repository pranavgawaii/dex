"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Building2, Code2, Star, Zap, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw, ChevronRight, Lightbulb, BookOpen, BriefcaseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CompanyIntel {
    id?: string;
    company_name: string;
    overview?: {
        name?: string;
        industry?: string;
        founded?: string;
        hq?: string;
        employees?: string;
        products?: string;
    } | null;
    tech_stack?: string[] | null;
    top_skills?: string[] | null;
    interview_qs?: Array<{ question: string; difficulty: string; role: string }> | null;
    interview_process?: string | null;
    glassdoor_rating?: number | null;
    culture_summary?: string | null;
    salary_range?: string | null;
    why_company_ans?: string | null;
    tell_me_about?: string | null;
    fit_score?: number | null;
    fit_highlights?: string[] | null;
    fit_gaps?: string[] | null;
    last_scraped?: string;
    from_cache?: boolean;
    cached_hours_ago?: number;
}

const LOADING_STEPS = [
    "Checking cache...",
    "Fetching company data...",
    "Analysing with Gemini AI...",
    "Building your intel report...",
];

const DIFFICULTY_COLORS: Record<string, string> = {
    Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function FitScoreRing({ score }: { score: number }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
                <motion.circle
                    cx="64" cy="64" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl font-bold "
                    style={{ color }}
                >
                    {score}
                </motion.span>
                <span className="text-xs text-text-muted">Fit Score</span>
            </div>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors shrink-0" title="Copy">
            {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
    );
}

export default function CompanyIntelWidget({ initialCompany }: { initialCompany?: string }) {
    const [searchQuery, setSearchQuery] = useState(initialCompany ?? "");
    const [intel, setIntel] = useState<CompanyIntel | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedQ, setExpandedQ] = useState<number | null>(null);
    const [imgError, setImgError] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const fetchIntel = useCallback(async (company: string) => {
        if (!company.trim()) return;
        setLoading(true);
        setError(null);
        setIntel(null);
        setLoadingStep(0);
        setImgError(false);

        for (let i = 1; i < LOADING_STEPS.length; i++) {
            await new Promise((r) => setTimeout(r, 1800));
            setLoadingStep(i);
        }

        try {
            const res = await fetch(`/api/intel/${encodeURIComponent(company.trim())}`);
            if (!res.ok) throw new Error("Failed to fetch intel");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setIntel(data);
            setActiveTab(0);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialCompany && initialCompany !== searchQuery) {
            setSearchQuery(initialCompany);
            fetchIntel(initialCompany);
        }
    }, [initialCompany, fetchIntel]);

    const handleSearch = () => {
        if (searchQuery.trim()) fetchIntel(searchQuery);
    };

    const hoursAgo = intel?.last_scraped
        ? Math.round((Date.now() - new Date(intel.last_scraped).getTime()) / (1000 * 60 * 60))
        : null;

    const tabs = ["Overview", "Interview Intel", "Your Fit"];

    return (
        <div className="w-full bg-surface border border-border rounded-xl shadow-sm flex flex-col overflow-hidden h-full max-h-[800px]">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-border shrink-0 bg-background">
                <div className="p-2.5 bg-background border border-border rounded-lg shadow-sm">
                    <Building2 size={20} strokeWidth={2.5} className="text-accent" />
                </div>
                <div className="flex-1">
                    <span className="font-semibold text-text-primary block tracking-tight text-lg">Company Intelligence</span>
                    <span className="text-xs font-medium text-text-muted mt-0.5 block">Target profile and culture metrics</span>
                </div>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-border bg-surface flex gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            clearTimeout(debounceRef.current);
                            debounceRef.current = setTimeout(() => {
                                if (e.target.value.trim().length >= 2) fetchIntel(e.target.value);
                            }, 500);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search target company..."
                        className="w-full h-10 pl-10 pr-4 text-sm border border-border bg-background rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted shadow-sm"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="h-10 px-5 text-sm bg-text-primary hover:bg-text-secondary text-background rounded-lg font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                >
                    {loading ? "..." : "Analyse"}
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-[400px]">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-2 border-border border-t-text-primary animate-spin" />
                            <div className="absolute inset-3 rounded-full flex items-center justify-center">
                                <Building2 size={16} className="text-text-primary" />
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="font-semibold text-text-primary  tracking-tight mb-4">
                                Analysing {searchQuery}...
                            </p>
                            <div className="space-y-3 text-left max-w-[240px] mx-auto">
                                {LOADING_STEPS.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        {i < loadingStep ? (
                                            <CheckCircle2 size={14} className="text-text-primary shrink-0" />
                                        ) : i === loadingStep ? (
                                            <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-text-primary border-t-transparent animate-spin shrink-0" />
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-border shrink-0" />
                                        )}
                                        <span className={cn("font-medium", i <= loadingStep ? "text-text-primary" : "text-text-muted")}>
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                        <AlertTriangle size={36} className="text-text-primary opacity-50" />
                        <div>
                            <p className="font-semibold text-text-primary tracking-tight  pt-2">Failed to load intel</p>
                            <p className="text-sm text-text-muted mt-1 max-w-[280px]">{error}</p>
                        </div>
                        <button onClick={handleSearch} className="flex items-center gap-2 px-5 py-2.5 mt-2 bg-text-primary text-background rounded-md text-sm font-medium shadow-sm transition-opacity hover:opacity-90">
                            <RefreshCw size={14} /> Retry
                        </button>
                    </div>
                )}

                {!loading && !error && !intel && (
                    <div className="flex flex-col items-center justify-center h-[500px] gap-4 p-8 text-center text-text-muted bg-background">
                        <div className="w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center mb-2">
                            <Building2 size={24} className="text-text-muted/50" />
                        </div>
                        <div>
                            <p className="font-semibold text-text-primary tracking-tight ">Select a Target</p>
                            <p className="text-sm mt-1 max-w-[250px] mx-auto font-medium">Search directly above to pull AI-powered intelligence reports.</p>
                        </div>
                    </div>
                )}

                {!loading && !error && intel && (
                    <div>
                        {/* Tabs */}
                        <div className="flex border-b border-border bg-background px-6 gap-6 shrink-0 overflow-x-auto no-scrollbar pt-1">
                            {tabs.map((tab, i) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(i)}
                                    className={cn(
                                        "py-4 text-sm font-bold transition-all relative whitespace-nowrap",
                                        activeTab === i
                                            ? "text-accent"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    {tab}
                                    {activeTab === i && (
                                        <motion.div
                                            layoutId="company-widget-tab"
                                            className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent rounded-t-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* TAB 1: Overview */}
                                    {activeTab === 0 && intel.overview && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-lg shrink-0 bg-background border border-border flex items-center justify-center overflow-hidden shadow-sm">
                                                    {imgError ? (
                                                        <Building2 size={24} className="text-text-muted/50" />
                                                    ) : (
                                                        <img
                                                            src={`https://logo.clearbit.com/${intel.company_name.toLowerCase().replace(/\s+/g, "")}.com`}
                                                            alt={intel.company_name}
                                                            className="w-full h-full object-contain p-2.5 bg-white"
                                                            onError={() => setImgError(true)}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-bold  text-text-primary">{intel.overview.name ?? intel.company_name}</h2>
                                                    {intel.glassdoor_rating && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map((n) => (
                                                                    <Star
                                                                        key={n}
                                                                        size={14}
                                                                        className={n <= Math.round(intel.glassdoor_rating!) ? "text-amber-400 fill-amber-400 drop-shadow-sm" : "text-border"}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-sm text-text-muted font-semibold bg-surface px-2.5 py-0.5 rounded-lg border border-border/50">{intel.glassdoor_rating} Glassdoor</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2.5 pt-4 pb-2">
                                                {intel.overview.industry && <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface/50 text-text-primary border border-border/60 shadow-sm">{intel.overview.industry}</span>}
                                                {intel.overview.hq && <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface/50 text-text-primary border border-border/60 shadow-sm">📍 {intel.overview.hq}</span>}
                                                {intel.overview.founded && <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface/50 text-text-primary border border-border/60 shadow-sm">📅 {intel.overview.founded}</span>}
                                                {intel.overview.employees && <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface/50 text-text-primary border border-border/60 shadow-sm">👥 {intel.overview.employees}</span>}
                                            </div>

                                            {intel.overview.products && (
                                                <div className="p-5 bg-background shadow-sm rounded-xl border border-border relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                                                    <p className="text-sm font-bold text-text-primary  tracking-tight mb-3">Primary Products</p>
                                                    <p className="text-sm text-text-secondary leading-relaxed font-medium pt-1">{intel.overview.products}</p>
                                                </div>
                                            )}

                                            {intel.tech_stack && intel.tech_stack.length > 0 && (
                                                <div className="p-5 bg-background shadow-sm rounded-xl border border-border relative overflow-hidden">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 rounded-lg bg-background border border-border">
                                                            <Code2 size={16} className="text-accent" />
                                                        </div>
                                                        <p className="text-sm font-bold text-text-primary  tracking-tight">Tech Stack</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        {intel.tech_stack.map((tech) => (
                                                            <span key={tech} className="px-3 py-1.5 text-xs font-semibold bg-surface/80 text-text-primary border border-border/80 rounded-xl shadow-sm hover:ring-2 hover:ring-accent/30 transition-all cursor-default">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {intel.culture_summary && (
                                                <div className="p-5 bg-background shadow-sm rounded-xl border border-border relative overflow-hidden">
                                                    <p className="text-sm font-bold text-text-primary  tracking-tight mb-3 border-b border-border pb-3">Culture Summary</p>
                                                    <p className="text-sm text-text-secondary leading-relaxed font-medium">{intel.culture_summary}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: Interview Intel */}
                                    {activeTab === 1 && (
                                        <div className="space-y-6">
                                            {intel.salary_range && (
                                                <div className="p-5 bg-background shadow-sm rounded-xl border border-border flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-background border border-border">
                                                            <BriefcaseIcon size={16} className="text-accent" />
                                                        </div>
                                                        <p className="text-sm font-bold text-text-primary tracking-tight ">Salary Estimate</p>
                                                    </div>
                                                    <p className="text-2xl font-bold text-text-primary  tracking-tight">{intel.salary_range}</p>
                                                </div>
                                            )}

                                            {intel.interview_process && (
                                                <div className="p-5 bg-background shadow-sm rounded-xl border border-border border-l-4 border-l-accent relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                                                    <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                                                        <div className="p-2 rounded-lg bg-background border border-border">
                                                            <ChevronRight size={16} strokeWidth={3} className="text-accent" />
                                                        </div>
                                                        <p className="text-sm font-bold text-text-primary  tracking-tight">Pipeline Structure</p>
                                                    </div>
                                                    <p className="text-sm text-text-secondary leading-relaxed font-medium pt-1">{intel.interview_process}</p>
                                                </div>
                                            )}

                                            {intel.interview_qs && intel.interview_qs.length > 0 && (
                                                <div className="bg-background border border-border shadow-sm rounded-xl overflow-hidden">
                                                    <div className="flex items-center gap-3 p-4 border-b border-border bg-surface">
                                                        <div className="p-2 rounded-lg bg-background border border-border">
                                                            <BookOpen size={16} className="text-accent" />
                                                        </div>
                                                        <p className="text-sm font-bold text-text-primary  tracking-tight">Reported Questions</p>
                                                    </div>
                                                    <div className="divide-y divide-border">
                                                        {(intel.interview_qs as Array<{ question: string; difficulty: string; role: string }>).map((q, i) => (
                                                            <div key={i} className="bg-transparent group">
                                                                <button
                                                                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                                                                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-5 text-left hover:bg-surface/30 transition-all gap-4"
                                                                >
                                                                    <span className="text-sm text-text-primary pr-4 leading-relaxed font-semibold">{q.question}</span>
                                                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                                                        <span className={cn("text-xs font-bold tracking-wide px-3 py-1.5 rounded-xl border shadow-sm",
                                                                            q.difficulty === 'Easy' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                                q.difficulty === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                                    "bg-red-50 text-red-700 border-red-200"
                                                                        )}>
                                                                            {q.difficulty}
                                                                        </span>
                                                                        <div className="p-1.5 rounded-full group-hover:bg-sidebar transition-colors">
                                                                            <ChevronRight size={16} className={cn("text-text-muted transition-transform", expandedQ === i && "rotate-90")} />
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                                {expandedQ === i && (
                                                                    <div className="px-5 pb-5 pt-0 text-sm text-text-secondary font-medium animate-in fade-in slide-in-from-top-2">
                                                                        <span className="font-bold text-text-primary">Role context:</span> {q.role}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 2 && (
                                        <div className="space-y-6">
                                            <div className="flex flex-col items-center gap-4 bg-background shadow-sm border border-border p-6 rounded-xl relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 pointer-events-none" />
                                                {intel.fit_score != null && (
                                                    <FitScoreRing score={intel.fit_score} />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {intel.fit_highlights && intel.fit_highlights.length > 0 && (
                                                    <div className="bg-background shadow-sm border border-border p-5 rounded-xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                                                        <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                                                            <div className="p-1.5 rounded-lg bg-background border border-border text-success">
                                                                <CheckCircle2 size={16} strokeWidth={2.5} />
                                                            </div>
                                                            <p className="text-sm font-bold text-text-primary tracking-tight ">Positives</p>
                                                        </div>
                                                        {intel.fit_highlights.map((h, i) => (
                                                            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0 group">
                                                                <span className="mt-1.5 w-1.5 h-1.5 bg-success rounded-full shrink-0 group-hover:scale-125 transition-transform" />
                                                                <span className="text-sm text-text-secondary leading-relaxed font-medium">{h}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {intel.fit_gaps && intel.fit_gaps.length > 0 && (
                                                    <div className="bg-background shadow-sm border border-border p-5 rounded-xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-warning/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                                                        <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                                                            <div className="p-1.5 rounded-lg bg-background border border-border text-warning">
                                                                <AlertTriangle size={16} strokeWidth={2.5} />
                                                            </div>
                                                            <p className="text-sm font-bold text-text-primary tracking-tight ">Knowledge Gaps</p>
                                                        </div>
                                                        {intel.fit_gaps.map((g, i) => (
                                                            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0 group">
                                                                <span className="mt-1.5 w-1.5 h-1.5 bg-warning rounded-full shrink-0 group-hover:scale-125 transition-transform" />
                                                                <span className="text-sm text-text-secondary leading-relaxed font-medium">{g}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {intel.tell_me_about && (
                                                <div className="p-5 bg-background shadow-sm rounded-xl border border-border relative group">
                                                    <div className="flex items-center justify-between gap-4 mb-4 border-b border-border pb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-background border border-border">
                                                                <Lightbulb size={16} className="text-accent" />
                                                            </div>
                                                            <p className="text-sm font-bold text-text-primary tracking-tight ">"Tell Me About Yourself" Angle</p>
                                                        </div>
                                                        <CopyButton text={intel.tell_me_about} />
                                                    </div>
                                                    <p className="text-sm text-text-secondary leading-relaxed font-medium pt-1">{intel.tell_me_about}</p>
                                                </div>
                                            )}

                                            {intel.why_company_ans && (
                                                <div className="p-5 bg-background shadow-sm rounded-xl border border-border relative group">
                                                    <div className="flex items-center justify-between gap-4 mb-4 border-b border-border pb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-background border border-border">
                                                                <Building2 size={16} className="text-accent" />
                                                            </div>
                                                            <p className="text-sm font-bold text-text-primary tracking-tight ">"Why {intel.company_name}?" Core Hook</p>
                                                        </div>
                                                        <CopyButton text={intel.why_company_ans} />
                                                    </div>
                                                    <p className="text-sm text-text-secondary leading-relaxed font-medium pt-1">{intel.why_company_ans}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {intel && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface shrink-0 mt-auto">
                    <span className="text-xs font-bold tracking-wide text-text-muted uppercase">
                        {intel.from_cache ? `Cache: ${hoursAgo}h ago` : "Live scan complete"}
                    </span>
                    <button
                        onClick={() => fetchIntel(intel.company_name)}
                        disabled={loading}
                        className="flex items-center gap-2 text-xs font-bold tracking-wide text-text-primary hover:text-text-secondary transition-all disabled:opacity-50 border border-border px-3 py-1.5 rounded-lg shadow-sm bg-background hover:bg-surface active:scale-95"
                    >
                        <RefreshCw size={14} />
                        RE-ANALYSE
                    </button>
                </div>
            )}
        </div>
    );
}

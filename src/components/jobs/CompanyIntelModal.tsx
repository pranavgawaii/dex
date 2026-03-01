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

interface CompanyIntelModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCompany?: string;
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

export default function CompanyIntelModal({ isOpen, onClose, initialCompany }: CompanyIntelModalProps) {
    const [searchQuery, setSearchQuery] = useState(initialCompany ?? "");
    const [intel, setIntel] = useState<CompanyIntel | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedQ, setExpandedQ] = useState<number | null>(null);
    const [imgError, setImgError] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchIntel = useCallback(async (company: string) => {
        if (!company.trim()) return;
        setLoading(true);
        setError(null);
        setIntel(null);
        setLoadingStep(0);
        setImgError(false);

        // Animate loading steps
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

    // Auto-fetch when initialCompany changes
    useEffect(() => {
        if (initialCompany && isOpen) {
            setSearchQuery(initialCompany);
            fetchIntel(initialCompany);
        }
    }, [initialCompany, isOpen, fetchIntel]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSearch = () => {
        if (searchQuery.trim()) fetchIntel(searchQuery);
    };

    const hoursAgo = intel?.last_scraped
        ? Math.round((Date.now() - new Date(intel.last_scraped).getTime()) / (1000 * 60 * 60))
        : null;

    const tabs = ["Overview", "Interview Intel", "Your Fit", "Open Roles"];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[780px] z-50 bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
                            <div className="p-2 bg-accent/10 rounded-lg">
                                <Building2 size={18} className="text-accent" />
                            </div>
                            <span className="font-semibold text-text-primary">Company Intelligence</span>

                            <div className="flex-1 relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    ref={inputRef}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        clearTimeout(debounceRef.current);
                                        debounceRef.current = setTimeout(() => {
                                            if (e.target.value.trim().length >= 2) fetchIntel(e.target.value);
                                        }, 500);
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search any company..."
                                    className="w-full h-9 pl-8 pr-3 text-sm border border-border bg-background rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                                />
                            </div>

                            <button
                                onClick={handleSearch}
                                disabled={loading || !searchQuery.trim()}
                                className="h-9 px-4 text-sm bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 shrink-0"
                            >
                                {loading ? "..." : "Analyse"}
                            </button>

                            <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Loading State */}
                            {loading && (
                                <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
                                    <div className="relative w-20 h-20">
                                        <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                                        <div className="absolute inset-3 rounded-full bg-accent/10 flex items-center justify-center">
                                            <Zap size={20} className="text-accent" />
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <p className="font-semibold text-text-primary mb-4">
                                            Analysing {searchQuery}...
                                        </p>
                                        <div className="space-y-2 text-left max-w-[240px] mx-auto">
                                            {LOADING_STEPS.map((step, i) => (
                                                <div key={i} className="flex items-center gap-2.5 text-sm">
                                                    {i < loadingStep ? (
                                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                    ) : i === loadingStep ? (
                                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
                                                    ) : (
                                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-border shrink-0" />
                                                    )}
                                                    <span className={i <= loadingStep ? "text-text-primary" : "text-text-muted"}>
                                                        {step}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error State */}
                            {!loading && error && (
                                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                                    <AlertTriangle size={48} className="text-warning opacity-50" />
                                    <div>
                                        <p className="font-semibold text-text-primary">Failed to load intel</p>
                                        <p className="text-sm text-text-muted mt-1">{error}</p>
                                    </div>
                                    <button onClick={handleSearch} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">
                                        <RefreshCw size={14} /> Retry
                                    </button>
                                </div>
                            )}

                            {/* Empty State */}
                            {!loading && !error && !intel && (
                                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center text-text-muted">
                                    <Building2 size={56} className="opacity-20" />
                                    <div>
                                        <p className="font-medium text-text-secondary">Search any company</p>
                                        <p className="text-sm mt-1">Get AI-powered interview intel in seconds</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {["Razorpay", "Zepto", "Groww", "Atlassian", "Google"].map((c) => (
                                            <button key={c} onClick={() => { setSearchQuery(c); fetchIntel(c); }}
                                                className="px-3 py-1.5 text-xs border border-border rounded-full hover:border-accent hover:text-accent transition-colors">
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Intel Content */}
                            {!loading && !error && intel && (
                                <div>
                                    {/* Tabs */}
                                    <div className="flex border-b border-border bg-transparent px-5 gap-1 shrink-0">
                                        {tabs.map((tab, i) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(i)}
                                                className={cn(
                                                    "px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
                                                    activeTab === i
                                                        ? "text-accent"
                                                        : "text-text-muted hover:text-text-secondary"
                                                )}
                                            >
                                                {tab}
                                                {activeTab === i && (
                                                    <motion.div
                                                        layoutId="company-tab-indicator"
                                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-5">
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
                                                    <div className="space-y-5">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-14 h-14 rounded-xl shrink-0 bg-surface border border-border flex items-center justify-center overflow-hidden">
                                                                {imgError ? (
                                                                    <Building2 size={24} className="text-text-muted" />
                                                                ) : (
                                                                    <>
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img
                                                                            src={`https://logo.clearbit.com/${intel.company_name.toLowerCase().replace(/\s+/g, "")}.com`}
                                                                            alt={intel.company_name}
                                                                            className="w-full h-full object-contain p-1"
                                                                            onError={() => setImgError(true)}
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h2 className="text-xl font-bold  text-text-primary">{intel.overview.name ?? intel.company_name}</h2>
                                                                <div className="flex flex-wrap gap-3 mt-1.5">
                                                                    {intel.overview.industry && <span className="text-xs text-text-muted">{intel.overview.industry}</span>}
                                                                    {intel.overview.hq && <span className="text-xs text-text-muted">📍 {intel.overview.hq}</span>}
                                                                    {intel.overview.founded && <span className="text-xs text-text-muted">📅 Est. {intel.overview.founded}</span>}
                                                                    {intel.overview.employees && <span className="text-xs text-text-muted">👥 {intel.overview.employees}</span>}
                                                                </div>
                                                                {intel.glassdoor_rating && (
                                                                    <div className="flex items-center gap-1.5 mt-2">
                                                                        <div className="flex gap-0.5">
                                                                            {[1, 2, 3, 4, 5].map((n) => (
                                                                                <Star
                                                                                    key={n}
                                                                                    size={13}
                                                                                    className={n <= Math.round(intel.glassdoor_rating!) ? "text-amber-400 fill-amber-400" : "text-border"}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-xs text-text-muted">{intel.glassdoor_rating} Glassdoor</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {intel.overview.products && (
                                                            <div className="p-4 bg-sidebar rounded-xl border border-border">
                                                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Products & Services</p>
                                                                <p className="text-sm text-text-secondary leading-relaxed">{intel.overview.products}</p>
                                                            </div>
                                                        )}

                                                        {intel.tech_stack && intel.tech_stack.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <Code2 size={15} className="text-accent" />
                                                                    <p className="text-sm font-semibold text-text-primary">Tech Stack</p>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {intel.tech_stack.map((tech) => (
                                                                        <span key={tech} className="px-2.5 py-1 text-xs font-medium bg-accent/10 text-accent border border-accent/20 rounded-full">
                                                                            {tech}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {intel.culture_summary && (
                                                            <div className="p-4 bg-sidebar rounded-xl border border-border">
                                                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Culture</p>
                                                                <p className="text-sm text-text-secondary leading-relaxed">{intel.culture_summary}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* TAB 2: Interview Intel */}
                                                {activeTab === 1 && (
                                                    <div className="space-y-5">
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            {intel.glassdoor_rating && (
                                                                <div className="p-4 bg-sidebar rounded-xl border border-border text-center">
                                                                    <p className="text-2xl font-bold text-accent ">{intel.glassdoor_rating}</p>
                                                                    <p className="text-xs text-text-muted mt-1">Glassdoor Rating</p>
                                                                </div>
                                                            )}
                                                            {intel.salary_range && (
                                                                <div className="p-4 bg-sidebar rounded-xl border border-border sm:col-span-2">
                                                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Salary (Fresher SDE)</p>
                                                                    <p className="text-sm font-semibold text-success">{intel.salary_range}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {intel.interview_process && (
                                                            <div className="p-4 bg-sidebar rounded-xl border border-border">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <ChevronRight size={15} className="text-accent" />
                                                                    <p className="text-sm font-semibold text-text-primary">Interview Process</p>
                                                                </div>
                                                                <p className="text-sm text-text-secondary leading-relaxed">{intel.interview_process}</p>
                                                            </div>
                                                        )}

                                                        {intel.interview_qs && intel.interview_qs.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <BookOpen size={15} className="text-accent" />
                                                                    <p className="text-sm font-semibold text-text-primary">Top Interview Questions</p>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {(intel.interview_qs as Array<{ question: string; difficulty: string; role: string }>).map((q, i) => (
                                                                        <div key={i} className="border border-border rounded-lg overflow-hidden">
                                                                            <button
                                                                                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                                                                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-sidebar transition-colors"
                                                                            >
                                                                                <span className="text-sm text-text-primary pr-4 line-clamp-1">{q.question}</span>
                                                                                <div className="flex items-center gap-2 shrink-0">
                                                                                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", DIFFICULTY_COLORS[q.difficulty] ?? DIFFICULTY_COLORS.Medium)}>
                                                                                        {q.difficulty}
                                                                                    </span>
                                                                                    <ChevronRight size={13} className={cn("text-text-muted transition-transform", expandedQ === i && "rotate-90")} />
                                                                                </div>
                                                                            </button>
                                                                            {expandedQ === i && (
                                                                                <div className="px-4 pb-3 text-xs text-text-muted border-t border-border">
                                                                                    <span className="font-medium">Role asked for:</span> {q.role}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* TAB 3: Your Fit */}
                                                {activeTab === 2 && (
                                                    <div className="space-y-6">
                                                        <div className="flex flex-col sm:flex-row items-center gap-6">
                                                            {intel.fit_score != null && (
                                                                <FitScoreRing score={intel.fit_score} />
                                                            )}
                                                            <div className="flex-1 space-y-3">
                                                                {intel.fit_highlights && intel.fit_highlights.length > 0 && (
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Highlight These ✓</p>
                                                                        {intel.fit_highlights.map((h, i) => (
                                                                            <div key={i} className="flex items-start gap-2.5 mb-1.5">
                                                                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                                                <span className="text-sm text-text-secondary">{h}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {intel.fit_gaps && intel.fit_gaps.length > 0 && (
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Prepare These ⚡</p>
                                                                        {intel.fit_gaps.map((g, i) => (
                                                                            <div key={i} className="flex items-start gap-2.5 mb-1.5">
                                                                                <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                                                                                <span className="text-sm text-text-secondary">{g}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {intel.tell_me_about && (
                                                            <div className="p-4 bg-sidebar rounded-xl border border-border">
                                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Lightbulb size={15} className="text-accent" />
                                                                        <p className="text-sm font-semibold text-text-primary">Tell Me About Yourself</p>
                                                                    </div>
                                                                    <CopyButton text={intel.tell_me_about} />
                                                                </div>
                                                                <p className="text-sm text-text-secondary leading-relaxed">{intel.tell_me_about}</p>
                                                            </div>
                                                        )}

                                                        {intel.why_company_ans && (
                                                            <div className="p-4 bg-sidebar rounded-xl border border-border">
                                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Building2 size={15} className="text-accent" />
                                                                        <p className="text-sm font-semibold text-text-primary">Why {intel.company_name}?</p>
                                                                    </div>
                                                                    <CopyButton text={intel.why_company_ans} />
                                                                </div>
                                                                <p className="text-sm text-text-secondary leading-relaxed">{intel.why_company_ans}</p>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                const text = [
                                                                    `=== Tell Me About Yourself (${intel.company_name}) ===`,
                                                                    intel.tell_me_about ?? "",
                                                                    "",
                                                                    `=== Why ${intel.company_name}? ===`,
                                                                    intel.why_company_ans ?? "",
                                                                ].join("\n");
                                                                navigator.clipboard.writeText(text);
                                                            }}
                                                            className="w-full py-2.5 border border-accent/30 text-accent rounded-xl text-sm font-medium hover:bg-accent/10 transition-colors"
                                                        >
                                                            Copy All for Interview Prep
                                                        </button>
                                                    </div>
                                                )}

                                                {/* TAB 4: Open Roles */}
                                                {activeTab === 3 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                                                            <BriefcaseIcon size={15} className="text-accent" />
                                                            <p className="text-sm text-text-secondary">
                                                                Showing live jobs at <strong>{intel.company_name}</strong> from your job feed.
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-text-muted text-center py-8">
                                                            Add jobs to your feed by running the scraper and they will appear here automatically.
                                                        </p>
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
                            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-sidebar/50 shrink-0">
                                <span className="text-xs text-text-muted">
                                    {intel.from_cache ? `Cached ${hoursAgo}h ago` : "Just analysed"}
                                </span>
                                <button
                                    onClick={() => fetchIntel(intel.company_name)}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={11} />
                                    Refresh Data
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

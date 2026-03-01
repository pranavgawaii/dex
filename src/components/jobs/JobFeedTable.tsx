"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search, MapPin, Bookmark, BookmarkCheck, EyeOff,
    ExternalLink, ChevronLeft, ChevronRight, Briefcase,
    Clock, Zap, RefreshCw, Filter, Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Job {
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
}

interface JobFeedTableProps {
    onAnalyseJD?: (jdText: string, company: string) => void;
    onViewIntel?: (company: string) => void;
}

const SOURCE_COLORS: Record<string, string> = {
    linkedin: "border-blue-200 text-blue-700 bg-blue-50/50 dark:border-blue-900/50 dark:text-blue-300 dark:bg-blue-950/20",
    naukri: "border-orange-200 text-orange-700 bg-orange-50/50 dark:border-orange-900/50 dark:text-orange-300 dark:bg-orange-950/20",
    indeed: "border-purple-200 text-purple-700 bg-purple-50/50 dark:border-purple-900/50 dark:text-purple-300 dark:bg-purple-950/20",
    glassdoor: "border-green-200 text-green-700 bg-green-50/50 dark:border-green-900/50 dark:text-green-300 dark:bg-green-950/20",
};

const JOB_TYPE_COLORS: Record<string, string> = {
    remote: "border-emerald-200 text-emerald-700 bg-emerald-50/50 dark:border-emerald-900/50 dark:text-emerald-300 dark:bg-emerald-950/20",
    onsite: "border-border text-text-primary bg-sidebar",
    hybrid: "border-violet-200 text-violet-700 bg-violet-50/50 dark:border-violet-900/50 dark:text-violet-300 dark:bg-violet-950/20",
};

function matchScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
}

function matchScoreBarColor(score: number): string {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "Unknown";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function SkeletonRow() {
    return (
        <tr className="border-b border-border animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <td key={i} className="px-4 py-3.5">
                    <div className="h-4 bg-surface rounded-md w-full" />
                </td>
            ))}
        </tr>
    );
}

export default function JobFeedTable({ onAnalyseJD, onViewIntel }: JobFeedTableProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [location, setLocation] = useState("");
    const [source, setSource] = useState("");
    const [freshness, setFreshness] = useState("7d");
    const [minMatch, setMinMatch] = useState(0);
    const [remoteOnly, setRemoteOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const fetchJobs = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(p),
                freshness,
                min_match_score: String(minMatch),
                remote_only: String(remoteOnly),
            });
            if (role) params.set("role", role);
            if (location) params.set("location", location);
            if (source) params.set("source", source);

            const res = await fetch(`/api/jobs/feed?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();

            setJobs(data.jobs ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.pages ?? 1);
            setPage(p);
        } catch {
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [role, location, source, freshness, minMatch, remoteOnly]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchJobs(1), 400);
        return () => clearTimeout(debounceRef.current);
    }, [fetchJobs]);

    const handleSave = async (id: string) => {
        setJobs((prev) => prev.map((j) => j.id === id ? { ...j, is_saved: !j.is_saved } : j));
        await fetch("/api/jobs/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
    };

    const handleHide = async (id: string) => {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        await fetch("/api/jobs/hide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
    };

    // Client-side search filter on top of API results
    const displayed = search
        ? jobs.filter(
            (j) =>
                j.title.toLowerCase().includes(search.toLowerCase()) ||
                j.company.toLowerCase().includes(search.toLowerCase())
        )
        : jobs;

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search company or role..."
                            className="w-full h-10 pl-9 pr-4 text-sm border border-border bg-background rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted"
                        />
                    </div>

                    {/* Freshness */}
                    <select
                        value={freshness}
                        onChange={(e) => setFreshness(e.target.value)}
                        className="h-10 px-3 text-sm border border-border bg-background rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-all cursor-pointer"
                    >
                        <option value="6h">Last 6h</option>
                        <option value="24h">Last 24h</option>
                        <option value="3d">Last 3 days</option>
                        <option value="7d">Last 7 days</option>
                    </select>

                    {/* Toggle Advanced Filters */}
                    <button
                        onClick={() => setShowFilters((v) => !v)}
                        className={cn(
                            "h-10 px-4 flex items-center gap-2 text-sm rounded-lg transition-all font-semibold",
                            showFilters
                                ? "bg-text-primary text-background"
                                : "bg-background border border-border text-text-secondary hover:text-text-primary hover:border-text-primary/30 shadow-sm"
                        )}
                    >
                        <Filter size={14} />
                        Filters
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={() => fetchJobs(page)}
                        disabled={loading}
                        className="h-10 px-4 flex items-center gap-2 text-sm bg-background border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-text-primary/30 transition-all disabled:opacity-50 font-semibold shadow-sm"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <input
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="Role (e.g. Backend Dev)"
                                    className="h-10 px-4 text-sm border border-border/80 bg-background rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all placeholder:text-text-muted"
                                />
                                <input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Location (e.g. Pune)"
                                    className="h-10 px-4 text-sm border border-border/80 bg-background rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all placeholder:text-text-muted"
                                />
                                <select
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    className="h-9 px-3 text-sm border border-border bg-background rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-all cursor-pointer"
                                >
                                    <option value="">All Sources</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="naukri">Naukri</option>
                                    <option value="indeed">Indeed</option>
                                    <option value="glassdoor">Glassdoor</option>
                                </select>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-semibold text-text-secondary whitespace-nowrap">
                                        MIN {minMatch}% MATCH
                                    </label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={minMatch}
                                        onChange={(e) => setMinMatch(+e.target.value)}
                                        className="flex-1 accent-accent"
                                    />
                                </div>
                            </div>
                            <div className="mt-5 flex items-center gap-2 cursor-pointer select-none w-fit" onClick={() => setRemoteOnly((v) => !v)}>
                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", remoteOnly ? "bg-accent border-accent" : "border-border/80 bg-background")}>
                                    {remoteOnly && <BookmarkCheck size={12} className="text-background" />}
                                </div>
                                <span className="text-sm font-medium text-text-secondary">Remote only</span>
                                <Wifi size={13} className={remoteOnly ? "text-text-primary ml-1" : "text-text-muted/50 ml-1"} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-sm text-text-muted px-1">
                <span>
                    {loading ? (
                        <span className="animate-pulse">Loading jobs...</span>
                    ) : (
                        <>
                            <span className="text-text-primary font-medium">{total}</span> jobs found
                        </>
                    )}
                </span>
                <span className="hidden sm:block text-xs">Feed refreshes at 7:00 AM IST daily</span>
            </div>

            {/* Table */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary">Company & Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary hidden md:table-cell">Location</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary hidden sm:table-cell">Source</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary hidden lg:table-cell">Posted</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary">Match</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : displayed.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-text-muted">
                                            <Briefcase size={40} className="opacity-30" />
                                            <div>
                                                <p className="font-medium text-text-secondary">No jobs found</p>
                                                <p className="text-xs mt-1">Feed refreshes at 7:00 AM IST daily</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayed.map((job, idx) => (
                                    <motion.tr
                                        key={job.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="hover:bg-background/50 transition-colors group"
                                    >
                                        <td className="px-5 py-4 max-w-[260px]">
                                            <div className="flex items-start gap-3">
                                                {/* Company logo */}
                                                <div className="w-9 h-9 rounded-md bg-white border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/\s+/g, "")}.com`}
                                                        alt={job.company}
                                                        className="w-full h-full object-contain p-1"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.visibility = "hidden";
                                                        }}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <button
                                                        onClick={() => onViewIntel?.(job.company)}
                                                        className="font-bold text-text-primary hover:text-text-secondary transition-colors truncate block text-[15px] tracking-tight"
                                                    >
                                                        {job.company}
                                                    </button>
                                                    <p className="text-sm font-medium text-text-secondary truncate mt-0.5">{job.title}</p>
                                                    {job.job_type && (
                                                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg mt-1.5 inline-block shadow-sm z-10",
                                                            JOB_TYPE_COLORS[job.job_type] ?? JOB_TYPE_COLORS.onsite
                                                        )}>
                                                            {job.job_type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Location */}
                                        <td className="px-5 py-4 hidden md:table-cell align-top text-text-secondary font-medium">
                                            <div className="flex items-center gap-2 pt-1 text-sm">
                                                <MapPin size={13} className="shrink-0 text-text-muted" />
                                                <span className="truncate max-w-[140px]">{job.location ?? "Not specified"}</span>
                                            </div>
                                        </td>

                                        {/* Source badge */}
                                        <td className="px-5 py-4 hidden sm:table-cell align-top">
                                            {job.source && (
                                                <span className={cn("flex w-fit items-center mt-1 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm border border-transparent",
                                                    SOURCE_COLORS[job.source] ?? "text-text-primary bg-surface border-border"
                                                )}>
                                                    {job.source}
                                                </span>
                                            )}
                                        </td>

                                        {/* Posted time */}
                                        <td className="px-5 py-4 hidden lg:table-cell align-top text-text-secondary">
                                            <div className="flex items-center gap-2 pt-1 text-sm">
                                                <Clock size={13} className="text-text-muted" />
                                                {timeAgo(job.posted_at ?? job.scraped_at)}
                                            </div>
                                        </td>

                                        {/* Match score */}
                                        <td className="px-5 py-4 align-top">
                                            {job.match_score != null ? (
                                                <div className="flex flex-col gap-1.5 pt-0.5">
                                                    <span className={cn("text-sm font-bold tracking-tight", matchScoreColor(job.match_score))}>
                                                        {job.match_score}%
                                                    </span>
                                                    <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-500", matchScoreBarColor(job.match_score))}
                                                            style={{ width: `${job.match_score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-text-muted text-xs font-medium pt-1 block">N/A</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-1.5 pt-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                {/* Analyse JD */}
                                                {job.description && (
                                                    <button
                                                        onClick={() => onAnalyseJD?.(job.description!, job.company)}
                                                        title="Analyse JD"
                                                        className="p-1.5 rounded-md hover:bg-sidebar text-text-muted hover:text-text-primary transition-colors border border-transparent hover:border-border"
                                                    >
                                                        <Zap size={14} />
                                                    </button>
                                                )}
                                                {/* Save */}
                                                <button
                                                    onClick={() => handleSave(job.id)}
                                                    title={job.is_saved ? "Unsave" : "Save job"}
                                                    className={cn("p-1.5 rounded-md transition-colors border",
                                                        job.is_saved
                                                            ? "text-background bg-text-primary border-text-primary"
                                                            : "text-text-muted border-transparent hover:border-border hover:bg-sidebar hover:text-text-primary"
                                                    )}
                                                >
                                                    {job.is_saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                                                </button>
                                                {/* Hide */}
                                                <button
                                                    onClick={() => handleHide(job.id)}
                                                    title="Hide this job"
                                                    className="p-1.5 rounded-md text-text-muted hover:text-error border border-transparent hover:border-error/20 hover:bg-error/10 transition-colors"
                                                >
                                                    <EyeOff size={14} />
                                                </button>
                                                {/* Apply */}
                                                {job.url && (
                                                    <a
                                                        href={job.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-md text-text-muted border border-transparent hover:border-border hover:bg-sidebar hover:text-text-primary transition-colors"
                                                        title="Apply"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface">
                        <span className="text-xs font-semibold text-text-muted">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchJobs(page - 1)}
                                disabled={page <= 1}
                                className="p-2 rounded-lg border border-border bg-background text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all shadow-sm focus:ring-1 focus:ring-accent"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => fetchJobs(page + 1)}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg border border-border bg-background text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all shadow-sm focus:ring-1 focus:ring-accent"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

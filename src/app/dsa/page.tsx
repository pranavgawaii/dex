"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Code2,
    Search,
    List,
    Layers,
    ChevronDown,
    ExternalLink,
    Play,
    StickyNote,
    Bell,
    BarChart2,
    RefreshCcw,
    Star
} from "lucide-react";
import {
    PieChart, Pie, Cell, Tooltip as ReTooltip,
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { useTheme } from "next-themes";
import {
    getDSAProblems,
    seedDSAProblems,
    updateDSAProblemStatus,
    DSAPlacementProblem,
} from "@/lib/supabase/queries";
import { Card, CardTitle } from "@/components/ui/Card";
import ProblemPanel from "@/components/dsa/ProblemPanel";
import DSALeetCodeCoach from "@/components/dsa/DSALeetCodeCoach";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_CHAPTERS = [
    "Arrays & Strings",
    "Binary Search",
    "Linked Lists",
    "Stacks & Queues",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Sliding Window & Two Pointers",
    "Heap & Priority Queue"
];

const STATUS_TABS = ["All", "Todo", "In Progress", "Done", "Revisit"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const CHAPTER_COLORS: Record<string, { light: string; dark: string }> = {
    "Arrays & Strings": { light: "bg-blue-50 text-blue-700 hover:bg-blue-100", dark: "dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20" },
    "Binary Search": { light: "bg-teal-50 text-teal-700 hover:bg-teal-100", dark: "dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20" },
    "Linked Lists": { light: "bg-pink-50 text-pink-700 hover:bg-pink-100", dark: "dark:bg-pink-500/10 dark:text-pink-400 dark:hover:bg-pink-500/20" },
    "Stacks & Queues": { light: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100", dark: "dark:bg-yellow-500/10 dark:text-yellow-400 dark:hover:bg-yellow-500/20" },
    "Trees": { light: "bg-green-50 text-green-700 hover:bg-green-100", dark: "dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20" },
    "Graphs": { light: "bg-orange-50 text-orange-700 hover:bg-orange-100", dark: "dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20" },
    "Dynamic Programming": { light: "bg-purple-50 text-purple-700 hover:bg-purple-100", dark: "dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20" },
    "Sliding Window & Two Pointers": { light: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100", dark: "dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/20" },
    "Heap & Priority Queue": { light: "bg-red-50 text-red-700 hover:bg-red-100", dark: "dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20" },
};

const DIFF_CLASSES: Record<string, string> = {
    Easy: "bg-green-50 text-green-700 border border-green-200/60 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
    Medium: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    Hard: "bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const STATUS_CLASSES: Record<string, string> = {
    "Todo": "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-[#1A1A1A] dark:text-[#888] dark:hover:bg-[#222]",
    "In Progress": "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30",
    "Done": "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30",
    "Revisit": "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30",
};

const STATUS_CYCLE: DSAPlacementProblem["status"][] = ["Todo", "In Progress", "Done", "Revisit"];

function ChapterChip({ chapter }: { chapter: string }) {
    const color = CHAPTER_COLORS[chapter] ?? { light: "bg-gray-100 text-gray-600", dark: "dark:bg-[#1A1A1A] dark:text-[#888]" };
    return (
        <span className={`inline-flex items-center text-[11px] rounded-md px-2 py-0.5 font-medium mt-1 transition-colors ${color.light} ${color.dark}`}>
            {chapter}
        </span>
    );
}

function SkeletonRows() {
    return (
        <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl overflow-hidden shadow-sm">
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-[#1F1F1F] last:border-0"
                >
                    <div className="w-6 h-3 bg-gray-100 dark:bg-[#1A1A1A] rounded animate-pulse" />
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-[#1A1A1A] rounded animate-pulse" />
                    <div className="w-24 h-7 bg-gray-100 dark:bg-[#1A1A1A] rounded-full animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ─── Pattern Group Row (collapsible) ─────────────────────────────────────────
interface ChapterGroupProps {
    chapter: string;
    problems: DSAPlacementProblem[];
    isExpanded: boolean;
    onToggle: () => void;
    onRowClick: (p: DSAPlacementProblem) => void;
    onStatusCycle: (p: DSAPlacementProblem) => void;
    onNotesClick: (p: DSAPlacementProblem) => void;
}

function ChapterGroup({ chapter, problems, isExpanded, onToggle, onRowClick, onStatusCycle, onNotesClick }: ChapterGroupProps) {
    const done = problems.filter((p) => p.status === "Done").length;
    const pct = problems.length > 0 ? (done / problems.length) * 100 : 0;

    return (
        <div className="border-b border-gray-100 dark:border-[#1F1F1F] last:border-0 bg-white dark:bg-[#0A0A0A]">
            <div
                className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#121212] transition-colors group select-none"
                onClick={onToggle}
            >
                <div className="flex-1 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-[#EAEAEA] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {chapter}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-[#666] font-medium bg-gray-100 dark:bg-[#1A1A1A] px-2 py-0.5 rounded-full">
                        {done} / {problems.length}
                    </span>
                </div>

                <div className="w-32 h-1.5 bg-gray-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden hidden sm:block">
                    <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-gray-400 dark:text-[#555]">
                    <ChevronDown className="size-4" />
                </motion.div>
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-gray-50/50 dark:bg-[#0C0C0C]/50 border-t border-gray-100 dark:border-[#1A1A1A]"
                    >
                        {problems.map((p) => (
                            <ProblemRow
                                key={p.id}
                                problem={p}
                                onRowClick={onRowClick}
                                onStatusCycle={onStatusCycle}
                                onNotesClick={onNotesClick}
                                indent
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Individual Problem Row ───────────────────────────────────────────────────
interface ProblemRowProps {
    problem: DSAPlacementProblem;
    onRowClick: (p: DSAPlacementProblem) => void;
    onStatusCycle: (p: DSAPlacementProblem) => void;
    onNotesClick: (p: DSAPlacementProblem) => void;
    indent?: boolean;
}

function ProblemRow({ problem, onRowClick, onStatusCycle, onNotesClick, indent }: ProblemRowProps) {
    const lcFullUrl = problem.lc_url.startsWith("http")
        ? problem.lc_url
        : `https://leetcode.com${problem.lc_url}`;

    const hasNotes = !!problem.notes;

    return (
        <div className={`flex items-center gap-3 md:gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#161616] transition-colors border-b border-gray-100 dark:border-[#1A1A1A] last:border-0 ${indent ? "sm:pl-8" : ""}`}>
            {/* Number */}
            <span className="w-8 shrink-0 text-[11px] text-gray-400 dark:text-[#555] font-mono font-medium text-right">
                {String(problem.number).padStart(3, '0')}
            </span>

            {/* Title & Tags */}
            <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                    {problem.is_must && (
                        <span title="Must-Know for Placements">
                            <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        </span>
                    )}
                    <span
                        className="text-sm font-medium text-gray-900 dark:text-[#EAEAEA] truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                        onClick={() => onRowClick(problem)}
                    >
                        {problem.title}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <ChapterChip chapter={problem.chapter} />
                    <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-sm px-1.5 py-0.5 mt-1 ${DIFF_CLASSES[problem.difficulty] ?? ""}`}>
                        {problem.difficulty}
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="hidden sm:flex gap-1 shrink-0 mr-2 opacity-60 hover:opacity-100 transition-opacity">
                <button
                    className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-[#222] text-gray-500 dark:text-[#888] hover:text-gray-900 dark:hover:text-[#EAEAEA] transition-colors"
                    title="Open in LeetCode"
                    onClick={() => window.open(lcFullUrl, "_blank")}
                >
                    <ExternalLink className="size-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-[#222] text-gray-500 dark:text-[#888] hover:text-red-500 transition-colors"
                    title="Striver Solution"
                    onClick={() => window.open(problem.yt_url, "_blank")}
                >
                    <Play className="size-3.5" />
                </button>
                <button
                    className={`p-1.5 rounded-md transition-colors ${hasNotes
                        ? "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                        : "text-gray-500 dark:text-[#888] hover:bg-gray-200 dark:hover:bg-[#222] hover:text-gray-900 dark:hover:text-[#EAEAEA]"
                        }`}
                    title="Notes"
                    onClick={() => onNotesClick(problem)}
                >
                    <StickyNote className="size-3.5" />
                </button>
            </div>

            {/* Status Button */}
            <button
                className={`shrink-0 w-24 text-[11px] font-semibold uppercase tracking-wider rounded-md px-0 py-2 cursor-pointer transition-all text-center select-none ${STATUS_CLASSES[problem.status] ?? ""}`}
                onClick={() => onStatusCycle(problem)}
                title="Click to cycle status"
            >
                {problem.status}
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DSAPage() {
    const { theme } = useTheme();
    const [problems, setProblems] = useState<DSAPlacementProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [statusFilter, setStatusFilter] = useState<StatusTab>("All");
    const [chapterFilter, setChapterFilter] = useState("All Chapters");
    const [difficultyFilter, setDifficultyFilter] = useState("All Levels");
    const [searchQuery, setSearchQuery] = useState("");
    const [mustKnowOnly, setMustKnowOnly] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "pattern">("pattern");

    const [selectedProblem, setSelectedProblem] = useState<DSAPlacementProblem | null>(null);
    const [panelDefaultTab, setPanelDefaultTab] = useState<"notes" | "details">("notes");

    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set([ALL_CHAPTERS[0]]));
    const [showAnalytics, setShowAnalytics] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Run seed first if DB is empty, then fetch.
        seedDSAProblems().then(() => {
            getDSAProblems().then((data) => {
                setProblems(data);
                setLoading(false);
            });
        });
    }, []);

    // ─── Derived stats ─────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const done = problems.filter((p) => p.status === "Done");
        const totalMustKnow = problems.filter(p => p.is_must).length;
        const mustKnowDone = problems.filter(p => p.is_must && p.status === "Done").length;

        return {
            total: problems.length,
            done: done.length,
            easy: done.filter((p) => p.difficulty === "Easy").length,
            medium: done.filter((p) => p.difficulty === "Medium").length,
            hard: done.filter((p) => p.difficulty === "Hard").length,
            pct: problems.length > 0 ? Math.round((done.length / problems.length) * 100) : 0,
            mustKnowPct: totalMustKnow > 0 ? Math.round((mustKnowDone / totalMustKnow) * 100) : 0
        };
    }, [problems]);

    // ─── Review due banner ─────────────────────────────────────────────────
    const today = new Date().toISOString().split("T")[0];
    const reviewDue = useMemo(
        // @ts-ignore
        () => problems.filter((p) => p.status === "Revisit" && p.revisit_date && p.revisit_date.split("T")[0] <= today),
        [problems, today]
    );

    // ─── Filtered problems ─────────────────────────────────────────────────
    const filteredProblems = useMemo(() => {
        return problems.filter((p) => {
            if (statusFilter !== "All" && p.status !== statusFilter) return false;
            if (chapterFilter !== "All Chapters" && p.chapter !== chapterFilter) return false;
            if (difficultyFilter !== "All Levels" && p.difficulty !== difficultyFilter) return false;
            if (mustKnowOnly && !p.is_must) return false;
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [problems, statusFilter, chapterFilter, difficultyFilter, mustKnowOnly, searchQuery]);

    // ─── Grouped by chapter ────────────────────────────────────────────────
    const groupedProblems = useMemo(() => {
        return ALL_CHAPTERS.map((chap) => ({
            chapter: chap,
            problems: filteredProblems.filter((p) => p.chapter === chap),
        })).filter((g) => g.problems.length > 0);
    }, [filteredProblems]);

    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleStatusCycle = useCallback(
        async (problem: DSAPlacementProblem) => {
            const idx = STATUS_CYCLE.indexOf(problem.status);
            const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
            setProblems((prev) => prev.map((p) => (p.id === problem.id ? { ...p, status: next } : p)));

            if (next === "Done") {
                import("../../lib/confetti").then(m => m.triggerConfetti());
            }

            if (selectedProblem?.id === problem.id) setSelectedProblem((prev) => prev ? { ...prev, status: next } : null);
            await updateDSAProblemStatus(problem.id, next);
        },
        [selectedProblem]
    );

    const handlePanelStatusChange = useCallback(
        async (id: string, status: DSAPlacementProblem["status"]) => {
            setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
            setSelectedProblem((prev) => (prev?.id === id ? { ...prev, status } : prev));
            await updateDSAProblemStatus(id, status);
        },
        []
    );

    const openPanel = (problem: DSAPlacementProblem, tab: "notes" | "details" = "notes") => {
        setSelectedProblem(problem);
        setPanelDefaultTab(tab);
    };

    const toggleChapter = (chapter: string) => {
        setExpandedChapters((prev) => {
            const next = new Set(prev);
            next.has(chapter) ? next.delete(chapter) : next.add(chapter);
            return next;
        });
    };

    // ─── Analytics data ────────────────────────────────────────────────────
    const pieData = [
        { name: "Easy", value: stats.easy, fill: "#22C55E" },
        { name: "Medium", value: stats.medium, fill: "#F59E0B" },
        { name: "Hard", value: stats.hard, fill: "#EF4444" },
    ].filter((d) => d.value > 0);

    const radarData = ALL_CHAPTERS.map((chap) => {
        const total = problems.filter((p) => p.chapter === chap).length;
        const done = problems.filter((p) => p.chapter === chap && p.status === "Done").length;
        return { chapter: chap.length > 12 ? chap.split(" ")[0] : chap, value: total > 0 ? Math.round((done / total) * 100) : 0 };
    });

    const isDark = theme === "dark";
    const accentColor = isDark ? "#3B82F6" : "#2563EB";
    const radarFill = isDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.15)";

    // ─── Render ────────────────────────────────────────────────────────────
    if (!mounted) return null;

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto font-sans pb-20">
            {/* Page Header - V6 Style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">DSA Practice</h1>
                    <p className="text-[15px] text-gray-500 dark:text-[#888] mt-1.5 flex items-center gap-2">
                        <span>Placement-focused</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]"></span>
                        <span>120 problems</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]"></span>
                        <span>9 chapters</span>
                    </p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                    <div className="flex gap-2 mb-2 w-full justify-between md:justify-end">
                        <div className="flex gap-1.5 items-center bg-gray-100 dark:bg-[#1A1A1A] rounded-md px-2 py-1">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-[#666] uppercase tracking-wider">Must-Know</span>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-500">{stats.mustKnowPct}%</span>
                        </div>
                        <div className="flex gap-1.5 items-center bg-green-50 dark:bg-green-500/10 rounded-md px-2 py-1 border border-green-200 dark:border-green-500/20">
                            <span className="text-[11px] font-semibold text-green-600/70 dark:text-green-500/70 uppercase tracking-wider">Easy</span>
                            <span className="text-sm font-bold text-green-700 dark:text-green-400">{stats.easy}</span>
                        </div>
                        <div className="flex gap-1.5 items-center bg-amber-50 dark:bg-amber-500/10 rounded-md px-2 py-1 border border-amber-200 dark:border-amber-500/20">
                            <span className="text-[11px] font-semibold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider">Med</span>
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{stats.medium}</span>
                        </div>
                        <div className="flex gap-1.5 items-center bg-red-50 dark:bg-red-500/10 rounded-md px-2 py-1 border border-red-200 dark:border-red-500/20">
                            <span className="text-[11px] font-semibold text-red-600/70 dark:text-red-500/70 uppercase tracking-wider">Hard</span>
                            <span className="text-sm font-bold text-red-700 dark:text-red-400">{stats.hard}</span>
                        </div>
                    </div>
                    <div className="w-full md:w-64 h-2 bg-gray-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>

            {/* Smart LeetCode Coach Banner */}
            <div className="mb-6">
                {/* @ts-ignore */}
                <DSALeetCodeCoach dexProblems={problems} />
            </div>

            {/* Filter + View Bar - Premium Design */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-2 md:p-1.5 mb-6 shadow-sm flex flex-col md:flex-row gap-2 sticky top-[72px] z-10">
                {/* Status Tabs */}
                <div className="flex bg-gray-50 dark:bg-[#111] rounded-lg p-1 border border-gray-100 dark:border-[#1F1F1F] overflow-x-auto hide-scrollbar shrink-0">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`flex justify-center whitespace-nowrap items-center px-4 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === tab
                                ? "bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-[#333]"
                                : "text-gray-500 dark:text-[#777] hover:text-gray-900 dark:hover:text-[#CCC]"
                                }`}
                        >
                            {tab}
                            {tab !== "All" && (
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-sm ${statusFilter === tab ? 'bg-gray-100 dark:bg-[#333]' : 'bg-gray-200 dark:bg-[#222]'} opacity-80`}>
                                    {problems.filter((p) => p.status === tab).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 flex-1 items-center flex-wrap md:flex-nowrap">
                    {/* Chapter select */}
                    <div className="relative group min-w-[140px] flex-1 md:flex-none">
                        <select
                            value={chapterFilter}
                            onChange={(e) => setChapterFilter(e.target.value)}
                            className="w-full text-xs bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1F1F1F] rounded-lg pl-3 pr-8 py-2 text-gray-700 dark:text-[#CCC] appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option>All Chapters</option>
                            {ALL_CHAPTERS.map((p) => <option key={p}>{p}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Difficulty select */}
                    <div className="relative group w-[100px] shrink-0">
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="w-full text-xs bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1F1F1F] rounded-lg pl-3 pr-8 py-2 text-gray-700 dark:text-[#CCC] appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option>All Levels</option>
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Must Know Toggle */}
                    <button
                        onClick={() => setMustKnowOnly(!mustKnowOnly)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all shrink-0 ${mustKnowOnly
                            ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
                            : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1F1F1F] text-gray-500 dark:text-[#777] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]"
                            }`}
                    >
                        <Star className={`size-3.5 ${mustKnowOnly ? "fill-amber-500 stroke-amber-500" : ""}`} />
                        Must-Know
                    </button>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[150px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 dark:text-[#555]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search problems..."
                            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1F1F1F] rounded-lg px-3 py-2 pl-8 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                        />
                    </div>

                    {/* View toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-[#1F1F1F] shrink-0">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center justify-center w-9 py-2 transition-colors ${viewMode === "list"
                                ? "bg-gray-200 dark:bg-[#333] text-gray-900 dark:text-white"
                                : "bg-gray-50 dark:bg-[#111] text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A]"
                                }`}
                            title="List View"
                        >
                            <List className="size-3.5" />
                        </button>
                        <button
                            onClick={() => setViewMode("pattern")}
                            className={`flex items-center justify-center w-9 py-2 transition-colors ${viewMode === "pattern"
                                ? "bg-gray-200 dark:bg-[#333] text-gray-900 dark:text-white"
                                : "bg-gray-50 dark:bg-[#111] text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A]"
                                }`}
                            title="Chapter View"
                        >
                            <Layers className="size-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Problem List / Pattern View */}
            {loading ? (
                <SkeletonRows />
            ) : filteredProblems.length === 0 && problems.length === 0 ? (
                <div className="flex flex-col items-center py-24 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl border-dashed">
                    <Code2 className="size-12 text-gray-300 dark:text-[#333]" />
                    <p className="text-base font-medium text-gray-500 dark:text-[#888] mt-4">No problems loaded</p>
                </div>
            ) : filteredProblems.length === 0 ? (
                <div className="flex flex-col items-center py-24 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl border-dashed">
                    <RefreshCcw className="size-10 text-gray-300 dark:text-[#333]" />
                    <p className="text-sm font-medium text-gray-500 dark:text-[#888] mt-4">No problems match your filters</p>
                    <button
                        className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => { setStatusFilter("All"); setChapterFilter("All Chapters"); setDifficultyFilter("All Levels"); setSearchQuery(""); setMustKnowOnly(false); }}
                    >
                        Clear filters
                    </button>
                </div>
            ) : viewMode === "list" ? (
                <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl overflow-hidden shadow-sm">
                    {filteredProblems.map((problem) => (
                        <ProblemRow
                            key={problem.id}
                            problem={problem}
                            onRowClick={(p) => openPanel(p, "notes")}
                            onStatusCycle={handleStatusCycle}
                            onNotesClick={(p) => openPanel(p, "notes")}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl overflow-hidden shadow-sm">
                    {groupedProblems.map(({ chapter, problems: gProblems }) => (
                        <ChapterGroup
                            key={chapter}
                            chapter={chapter}
                            problems={gProblems}
                            isExpanded={expandedChapters.has(chapter)}
                            onToggle={() => toggleChapter(chapter)}
                            onRowClick={(p) => openPanel(p, "notes")}
                            onStatusCycle={handleStatusCycle}
                            onNotesClick={(p) => openPanel(p, "notes")}
                        />
                    ))}
                </div>
            )}

            {/* Problem Panel */}
            <AnimatePresence>
                {selectedProblem && (
                    <ProblemPanel
                        key={selectedProblem.id}
                        // @ts-ignore
                        problem={selectedProblem}
                        defaultTab={panelDefaultTab}
                        onClose={() => setSelectedProblem(null)}
                        // @ts-ignore
                        onStatusChange={handlePanelStatusChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

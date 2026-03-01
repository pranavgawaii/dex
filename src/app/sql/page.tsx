"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Database,
    Search,
    List,
    Layers,
    ChevronDown,
    ExternalLink,
    StickyNote,
    Star,
    RefreshCcw,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
    getSQLProblems,
    updateSQLProblemStatus,
    SQLProblem,
} from "@/lib/supabase/queries";
import SQLPanel from "@/components/sql/SQLPanel";
import DSALeetCodeCoach from "@/components/dsa/DSALeetCodeCoach";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_TABS = ["All", "Todo", "In Progress", "Done", "Revisit"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const PHASES = [
    { num: 1, name: "SELECT & WHERE", count: 14, filter: "Phase 1: SELECT" },
    { num: 2, name: "Aggregate & GROUP BY", count: 8, filter: "Phase 2: Aggregate" },
    { num: 3, name: "Sorting & Advanced Grouping", count: 6, filter: "Phase 3: Sorting" },
    { num: 4, name: "Window Functions & CTEs", count: 22, filter: "Phase 4: Window Functions" },
];

const PHASE_COLORS: Record<number, { light: string; dark: string }> = {
    1: { light: "bg-blue-50 text-blue-700 hover:bg-blue-100", dark: "dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20" },
    2: { light: "bg-teal-50 text-teal-700 hover:bg-teal-100", dark: "dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20" },
    3: { light: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100", dark: "dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20" },
    4: { light: "bg-violet-50 text-violet-700 hover:bg-violet-100", dark: "dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20" },
};

const STATUS_CLASSES: Record<string, string> = {
    "Todo": "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-[#1A1A1A] dark:text-[#888] dark:hover:bg-[#222]",
    "In Progress": "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30",
    "Done": "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30",
    "Revisit": "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30",
};

const STATUS_CYCLE: SQLProblem["status"][] = ["Todo", "In Progress", "Done", "Revisit"];
const STARRED_PROBLEMS = [176, 178, 180, 184, 185, 570];

function PhaseChip({ phase, concept }: { phase: number, concept: string }) {
    const color = PHASE_COLORS[phase] ?? { light: "bg-gray-100 text-gray-600", dark: "dark:bg-[#1A1A1A] dark:text-[#888]" };
    return (
        <span className={`inline-flex items-center text-[11px] rounded-md px-2 py-0.5 font-medium mt-1 transition-colors ${color.light} ${color.dark}`}>
            Phase {phase} • {concept}
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

// ─── Phase Group Row (collapsible) ─────────────────────────────────────────
interface PhaseGroupProps {
    phase: typeof PHASES[0];
    problems: SQLProblem[];
    isExpanded: boolean;
    onToggle: () => void;
    onRowClick: (p: SQLProblem, tab: "solution" | "notes" | "details" | "cheatsheet") => void;
    onStatusCycle: (p: SQLProblem) => void;
}

function PhaseGroup({ phase, problems, isExpanded, onToggle, onRowClick, onStatusCycle }: PhaseGroupProps) {
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
                        Phase {phase.num}: {phase.name}
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
                                onRowClick={(tab) => onRowClick(p, tab)}
                                onStatusCycle={onStatusCycle}
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
    problem: SQLProblem;
    onRowClick: (tab: "solution" | "notes" | "details" | "cheatsheet") => void;
    onStatusCycle: (p: SQLProblem) => void;
    indent?: boolean;
}

function ProblemRow({ problem, onRowClick, onStatusCycle, indent }: ProblemRowProps) {
    const lcFullUrl = problem.lc_url.startsWith("http")
        ? problem.lc_url
        : `https://leetcode.com${problem.lc_url}`;

    const hasNotes = !!problem.notes;
    const isMust = STARRED_PROBLEMS.includes(problem.number);

    return (
        <div className={`flex items-center gap-3 md:gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#161616] transition-colors border-b border-gray-100 dark:border-[#1A1A1A] last:border-0 ${indent ? "sm:pl-8" : ""}`}>
            {/* Number */}
            <span className="w-8 shrink-0 text-[11px] text-gray-400 dark:text-[#555] font-mono font-medium text-right">
                {String(problem.number).padStart(3, '0')}
            </span>

            {/* Title & Tags */}
            <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                    {isMust && (
                        <span title="Must-Know for Placements">
                            <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        </span>
                    )}
                    <span
                        className="text-sm font-medium text-gray-900 dark:text-[#EAEAEA] truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                        onClick={() => onRowClick("solution")}
                    >
                        {problem.title}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <PhaseChip phase={problem.phase} concept={problem.concept} />
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
                    className={`p-1.5 rounded-md transition-colors ${hasNotes
                        ? "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                        : "text-gray-500 dark:text-[#888] hover:bg-gray-200 dark:hover:bg-[#222] hover:text-gray-900 dark:hover:text-[#EAEAEA]"
                        }`}
                    title="Notes"
                    onClick={() => onRowClick("notes")}
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
export default function SQLPage() {
    const { theme } = useTheme();
    const [problems, setProblems] = useState<SQLProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [statusFilter, setStatusFilter] = useState<StatusTab>("All");
    const [phaseFilter, setPhaseFilter] = useState("All Phases");
    const [searchQuery, setSearchQuery] = useState("");
    const [mustKnowOnly, setMustKnowOnly] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "phase">("phase");

    const [selectedProblem, setSelectedProblem] = useState<SQLProblem | null>(null);
    const [panelDefaultTab, setPanelDefaultTab] = useState<"solution" | "notes" | "details" | "cheatsheet">("solution");

    const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));

    useEffect(() => {
        setMounted(true);
        getSQLProblems().then((data) => {
            setProblems(data);
            setLoading(false);
        });
    }, []);

    // ─── Derived stats ─────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const done = problems.filter((p) => p.status === "Done");
        const totalMustKnow = problems.filter(p => STARRED_PROBLEMS.includes(p.number)).length || 6;
        const mustKnowDone = problems.filter(p => STARRED_PROBLEMS.includes(p.number) && p.status === "Done").length;

        return {
            total: problems.length || 50,
            done: done.length,
            ph1: done.filter((p) => p.phase === 1).length,
            ph2: done.filter((p) => p.phase === 2).length,
            ph3: done.filter((p) => p.phase === 3).length,
            ph4: done.filter((p) => p.phase === 4).length,
            pct: problems.length > 0 ? Math.round((done.length / problems.length) * 100) : 0,
            mustKnowPct: totalMustKnow > 0 ? Math.round((mustKnowDone / totalMustKnow) * 100) : 0
        };
    }, [problems]);

    // ─── Filtered problems ─────────────────────────────────────────────────
    const filteredProblems = useMemo(() => {
        return problems.filter((p) => {
            if (statusFilter !== "All" && p.status !== statusFilter) return false;
            if (phaseFilter !== "All Phases") {
                const matchPhase = PHASES.find(ph => ph.filter === phaseFilter);
                if (matchPhase && p.phase !== matchPhase.num) return false;
            }
            if (mustKnowOnly && !STARRED_PROBLEMS.includes(p.number)) return false;
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [problems, statusFilter, phaseFilter, mustKnowOnly, searchQuery]);

    // ─── Grouped by phase ────────────────────────────────────────────────
    const groupedProblems = useMemo(() => {
        return PHASES.map((ph) => ({
            phase: ph,
            problems: filteredProblems.filter((p) => p.phase === ph.num),
        })).filter((g) => g.problems.length > 0);
    }, [filteredProblems]);

    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleStatusCycle = useCallback(
        async (problem: SQLProblem) => {
            const idx = STATUS_CYCLE.indexOf(problem.status);
            const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
            setProblems((prev) => prev.map((p) => (p.id === problem.id ? { ...p, status: next } : p)));

            if (next === "Done") {
                import("../../lib/confetti").then(m => m.triggerConfetti());
            }

            if (selectedProblem?.id === problem.id) setSelectedProblem((prev) => prev ? { ...prev, status: next } : null);
            await updateSQLProblemStatus(problem.id, next);
        },
        [selectedProblem]
    );

    const handlePanelStatusChange = useCallback(
        async (id: string, status: SQLProblem["status"]) => {
            setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
            setSelectedProblem((prev) => (prev?.id === id ? { ...prev, status } : prev));
            await updateSQLProblemStatus(id, status);
        },
        []
    );

    const openPanel = (problem: SQLProblem, tab: "solution" | "notes" | "details" | "cheatsheet" = "solution") => {
        setSelectedProblem(problem);
        setPanelDefaultTab(tab);
    };

    const togglePhase = (num: number) => {
        setExpandedPhases((prev) => {
            const next = new Set(prev);
            next.has(num) ? next.delete(num) : next.add(num);
            return next;
        });
    };

    // ─── Render ────────────────────────────────────────────────────────────
    if (!mounted) return null;

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto font-sans pb-20">
            {/* Page Header - V6 Style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">SQL Practice</h1>
                    <p className="text-[15px] text-gray-500 dark:text-[#888] mt-1.5 flex items-center gap-2">
                        <span>Placement-focused</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]"></span>
                        <span>50 problems</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#333]"></span>
                        <span>4 phases</span>
                    </p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                    <div className="flex gap-2 mb-2 w-full justify-between md:justify-end">
                        <div className="flex gap-1.5 items-center bg-gray-100 dark:bg-[#1A1A1A] rounded-md px-2 py-1">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-[#666] uppercase tracking-wider">Must-Know</span>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-500">{stats.mustKnowPct}%</span>
                        </div>
                        <div className="flex gap-1.5 items-center bg-blue-50 dark:bg-blue-500/10 rounded-md px-2 py-1 border border-blue-200 dark:border-blue-500/20">
                            <span className="text-[11px] font-semibold text-blue-600/70 dark:text-blue-500/70 uppercase tracking-wider">PH1</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{stats.ph1}</span>
                        </div>
                        <div className="flex gap-1.5 items-center bg-teal-50 dark:bg-teal-500/10 rounded-md px-2 py-1 border border-teal-200 dark:border-teal-500/20">
                            <span className="text-[11px] font-semibold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-wider">PH2</span>
                            <span className="text-sm font-bold text-teal-700 dark:text-teal-400">{stats.ph2}</span>
                        </div>
                        <div className="flex gap-1.5 items-center bg-indigo-50 dark:bg-indigo-500/10 rounded-md px-2 py-1 border border-indigo-200 dark:border-indigo-500/20">
                            <span className="text-[11px] font-semibold text-indigo-600/70 dark:text-indigo-500/70 uppercase tracking-wider">PH3</span>
                            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{stats.ph3}</span>
                        </div>
                        <div className="flex gap-1.5 items-center bg-violet-50 dark:bg-violet-500/10 rounded-md px-2 py-1 border border-violet-200 dark:border-violet-500/20">
                            <span className="text-[11px] font-semibold text-violet-600/70 dark:text-violet-500/70 uppercase tracking-wider">PH4</span>
                            <span className="text-sm font-bold text-violet-700 dark:text-violet-400">{stats.ph4}</span>
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

            <div className="mb-6">
                <DSALeetCodeCoach
                    isSQL={true}
                    dexProblems={problems.map(p => ({
                        id: p.id,
                        number: p.number,
                        title: p.title,
                        status: p.status,
                        chapter: p.concept,
                        difficulty: p.difficulty as "Easy" | "Medium" | "Hard",
                        lc_url: p.lc_url,
                        yt_url: "",
                        is_must: STARRED_PROBLEMS.includes(p.number),
                        notes: p.notes
                    }))}
                />
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
                    {/* Phase select */}
                    <div className="relative group min-w-[140px] flex-1 md:flex-none">
                        <select
                            value={phaseFilter}
                            onChange={(e) => setPhaseFilter(e.target.value)}
                            className="w-full text-xs bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1F1F1F] rounded-lg pl-3 pr-8 py-2 text-gray-700 dark:text-[#CCC] appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option>All Phases</option>
                            {PHASES.map((p) => <option key={p.num}>{p.filter}</option>)}
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
                            onClick={() => setViewMode("phase")}
                            className={`flex items-center justify-center w-9 py-2 transition-colors ${viewMode === "phase"
                                ? "bg-gray-200 dark:bg-[#333] text-gray-900 dark:text-white"
                                : "bg-gray-50 dark:bg-[#111] text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A]"
                                }`}
                            title="Phase View"
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
                    <Database className="size-12 text-gray-300 dark:text-[#333]" />
                    <p className="text-base font-medium text-gray-500 dark:text-[#888] mt-4">No SQL problems loaded</p>
                </div>
            ) : filteredProblems.length === 0 ? (
                <div className="flex flex-col items-center py-24 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl border-dashed">
                    <RefreshCcw className="size-10 text-gray-300 dark:text-[#333]" />
                    <p className="text-sm font-medium text-gray-500 dark:text-[#888] mt-4">No problems match your filters</p>
                    <button
                        className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => { setStatusFilter("All"); setPhaseFilter("All Phases"); setSearchQuery(""); setMustKnowOnly(false); }}
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
                            onRowClick={(tab) => openPanel(problem, tab)}
                            onStatusCycle={handleStatusCycle}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl overflow-hidden shadow-sm">
                    {groupedProblems.map(({ phase, problems: gProblems }) => (
                        <PhaseGroup
                            key={phase.num}
                            phase={phase}
                            problems={gProblems}
                            isExpanded={expandedPhases.has(phase.num)}
                            onToggle={() => togglePhase(phase.num)}
                            onRowClick={(p, tab) => openPanel(p, tab)}
                            onStatusCycle={handleStatusCycle}
                        />
                    ))}
                </div>
            )}

            {/* Problem Panel */}
            <AnimatePresence>
                {selectedProblem && (
                    <SQLPanel
                        key={selectedProblem.id}
                        problem={selectedProblem}
                        defaultTab={panelDefaultTab}
                        onClose={() => setSelectedProblem(null)}
                        onStatusChange={handlePanelStatusChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}


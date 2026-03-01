"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ExternalLink,
    Play,
    Star,
    Save
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { DSAPlacementProblem, updateDSAProblemNotes } from "@/lib/supabase/queries";

// ─── Constants ───────────────────────────────────────────────────────────────
const CHAPTER_COLORS: Record<string, { light: string; dark: string }> = {
    "Arrays & Strings": { light: "bg-blue-50 text-blue-700 border border-blue-100", dark: "dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
    "Binary Search": { light: "bg-teal-50 text-teal-700 border border-teal-100", dark: "dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20" },
    "Linked Lists": { light: "bg-pink-50 text-pink-700 border border-pink-100", dark: "dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20" },
    "Stacks & Queues": { light: "bg-yellow-50 text-yellow-700 border border-yellow-100", dark: "dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20" },
    "Trees": { light: "bg-green-50 text-green-700 border border-green-100", dark: "dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" },
    "Graphs": { light: "bg-orange-50 text-orange-700 border border-orange-100", dark: "dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" },
    "Dynamic Programming": { light: "bg-purple-50 text-purple-700 border border-purple-100", dark: "dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20" },
    "Sliding Window & Two Pointers": { light: "bg-cyan-50 text-cyan-700 border border-cyan-100", dark: "dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20" },
    "Heap & Priority Queue": { light: "bg-red-50 text-red-700 border border-red-100", dark: "dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
};

const DIFF_CLASSES: Record<string, string> = {
    Easy: "bg-green-50 text-green-700 border border-green-200/60 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
    Medium: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    Hard: "bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const STATUS_CYCLE: DSAPlacementProblem["status"][] = ["Todo", "In Progress", "Done", "Revisit"];

interface ProblemPanelProps {
    problem: DSAPlacementProblem;
    onClose: () => void;
    onStatusChange: (id: string, status: DSAPlacementProblem["status"]) => void;
    defaultTab?: "solution" | "notes" | "details";
}

export default function ProblemPanel({ problem, onClose, onStatusChange, defaultTab = "notes" }: ProblemPanelProps) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<"solution" | "notes" | "details">(defaultTab);
    const [notes, setNotes] = useState(problem.notes || "");
    const [solutionCode, setSolutionCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize state when problem changes
    useEffect(() => {
        setNotes(problem.notes || "");
        setActiveTab(defaultTab);

        // Load solution from localStorage
        const savedSolution = localStorage.getItem(`dsa_solution_${problem.id}`);
        if (savedSolution) {
            setSolutionCode(savedSolution);
        } else {
            setSolutionCode(`// Write your solution for ${problem.title}\n// Language: Python/JavaScript/etc.\n\nfunction solve() {\n  \n}`);
        }
    }, [problem.id, problem.notes, problem.title, defaultTab]);

    const handleNotesChange = useCallback((value: string) => {
        setNotes(value);
        setIsSaving(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateDSAProblemNotes(problem.id, value).then(() => {
                setIsSaving(false);
            });
        }, 800);
    }, [problem.id]);

    const handleSolutionChange = useCallback((value: string | undefined) => {
        if (!value) return;
        setSolutionCode(value);
        localStorage.setItem(`dsa_solution_${problem.id}`, value);
    }, [problem.id]);

    const handleStatusClick = (status: DSAPlacementProblem["status"]) => {
        onStatusChange(problem.id, status);
    };

    const chapterColor = CHAPTER_COLORS[problem.chapter] ?? {
        light: "bg-gray-50 text-gray-600 border border-gray-200",
        dark: "dark:bg-[#1A1A1A] dark:text-[#888] dark:border-[#333]",
    };

    const lcFullUrl = problem.lc_url.startsWith("http")
        ? problem.lc_url
        : `https://leetcode.com${problem.lc_url}`;

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
                onClick={onClose}
            />

            {/* Sliding Panel */}
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed right-0 top-0 h-full w-full max-w-[500px] z-50 bg-white dark:bg-[#0A0A0A] border-l border-gray-200 dark:border-[#1F1F1F] shadow-2xl flex flex-col font-sans"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-[#1F1F1F] relative bg-gray-50/50 dark:bg-[#0C0C0C]/50 backdrop-blur-md">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-1.5 rounded-md bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#222] text-gray-500 dark:text-[#888] hover:text-gray-900 dark:hover:text-[#EAEAEA] transition-colors"
                    >
                        <X className="size-4" />
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-400 dark:text-[#555] font-mono text-[11px] font-semibold bg-gray-100 dark:bg-[#1A1A1A] px-1.5 py-0.5 rounded-sm">
                            #{String(problem.number).padStart(3, '0')}
                        </span>
                        {problem.is_must && (
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-sm border border-amber-200 dark:border-amber-500/20">
                                <Star className="size-3 fill-amber-500 stroke-amber-500" /> Must-Know
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-[#EAEAEA] pr-10 leading-tight">
                        {problem.title}
                    </h2>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider rounded-sm px-2 py-0.5 ${DIFF_CLASSES[problem.difficulty] ?? ""}`}>
                            {problem.difficulty}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider rounded-sm px-2 py-0.5 ${chapterColor.light} ${chapterColor.dark}`}>
                            {problem.chapter}
                        </span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex px-6 pt-0 border-b border-gray-100 dark:border-[#1F1F1F] bg-white dark:bg-[#0A0A0A]">
                    {(["solution", "notes", "details"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-[13px] py-3.5 mr-6 capitalize font-semibold transition-colors border-b-2 relative ${activeTab === tab
                                ? "border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 dark:text-[#777] hover:text-gray-900 dark:hover:text-[#CCC]"
                                }`}
                        >
                            {tab === "solution" ? "My Solution" : tab}
                        </button>
                    ))}
                </div>

                {/* Scrollable Tab Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-[#050505]">
                    {activeTab === "solution" && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 min-h-[400px]">
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    theme={theme === "dark" ? "vs-dark" : "light"}
                                    value={solutionCode}
                                    onChange={handleSolutionChange}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        lineHeight: 1.6,
                                        padding: { top: 16, bottom: 16 },
                                        scrollBeyondLastLine: false,
                                        smoothScrolling: true,
                                        cursorBlinking: "smooth"
                                    }}
                                    className="border-b border-gray-200 dark:border-[#1F1F1F]"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "notes" && (
                        <div className="px-6 py-6 h-full flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[11px] font-bold text-gray-500 dark:text-[#666] uppercase tracking-wider">
                                    Personal Notes
                                </p>
                                <AnimatePresence>
                                    {isSaving && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-[#555]"
                                        >
                                            <Save className="size-3" /> Saving...
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <textarea
                                className="flex-1 w-full rounded-xl p-4 text-sm bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1F1F1F] text-gray-900 dark:text-[#EAEAEA] placeholder:text-gray-400 dark:placeholder:text-[#444] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-shadow shadow-sm font-sans"
                                placeholder="Jot down your approach, key insights, time/space complexity, or edge cases here..."
                                value={notes}
                                onChange={(e) => handleNotesChange(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === "details" && (
                        <div className="px-6 py-6 space-y-4">
                            <p className="text-[11px] font-bold text-gray-500 dark:text-[#666] uppercase tracking-wider mb-2">
                                External Resources
                            </p>

                            <a
                                href={lcFullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between group w-full bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4 text-sm font-medium text-gray-800 dark:text-[#EAEAEA] hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 dark:bg-[#1A1A1A] p-2 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                                        <ExternalLink className="size-4 text-gray-500 dark:text-[#888] group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    View Problem on LeetCode
                                </div>
                                <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">→</span>
                            </a>

                            <a
                                href={problem.yt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between group w-full bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4 text-sm font-medium text-gray-800 dark:text-[#EAEAEA] hover:border-red-400 dark:hover:border-red-500/50 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 dark:bg-[#1A1A1A] p-2 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-500/10 transition-colors">
                                        <Play className="size-4 text-gray-500 dark:text-[#888] group-hover:text-red-500 transition-colors" />
                                    </div>
                                    Watch Striver Video Solution
                                </div>
                                <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">→</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* Sticky Bottom Status Grid */}
                <div className="p-5 border-t border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0A0A0A] shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-[#666] uppercase tracking-wider mb-3 px-1">
                        Update Problem Status
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {STATUS_CYCLE.map((s) => (
                            <button
                                key={s}
                                onClick={() => handleStatusClick(s)}
                                className={`text-[11px] font-bold uppercase tracking-wider rounded-lg py-2.5 text-center transition-all border ${problem.status === s
                                    ? s === "Todo"
                                        ? "bg-gray-800 text-white border-gray-900 dark:bg-[#EAEAEA] dark:text-[#0A0A0A] dark:border-white shadow-sm"
                                        : s === "In Progress"
                                            ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 shadow-sm"
                                            : s === "Done"
                                                ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 shadow-sm"
                                                : "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 shadow-sm"
                                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-[#111] dark:text-[#666] dark:border-[#222] dark:hover:bg-[#1A1A1A]"
                                    }`}
                            >
                                {s === "In Progress" ? "Progress" : s}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </>
    );
}

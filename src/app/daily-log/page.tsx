"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sun,
    Moon,
    Code2,
    Database,
    Github,
    Clock,
    Sparkles,
    FileText,
    Copy,
    ArrowRight,
    Check,
    RefreshCw,
    Info,
    Bot,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { useTheme } from "next-themes";
import {
    getTodayLog,
    upsertTodayLog,
    getRecentLogs,
    DailyLog
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

// --- Constants ---
const MOOD_EMOJIS = ["😫", "😐", "😊", "😄", "🚀"];
const DSA_PATTERNS = [
    "Arrays", "Binary Search", "Linked Lists", "Trees", "Graphs",
    "DP", "Stacks", "Sliding Window", "Heaps"
];

// Formatting helper
function formatTodayDate() {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// Generate an array of 14 dates up to today
function getLast14DaysDates() {
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push({
            dateStr: d.toISOString().split("T")[0],
            dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
            dayNum: d.getDate(),
        });
    }
    return dates;
}

interface AIPost {
    type: string;
    content: string;
    hashtags: string[];
}

export default function DailyLogPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Log history
    const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);
    const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>("");

    // Form states
    const [energy, setEnergy] = useState<number>(5);
    const [focusPattern, setFocusPattern] = useState<string>("None Selected");
    const [tasks, setTasks] = useState<string[]>(["", "", ""]);

    const [learnedToday, setLearnedToday] = useState<string>("");
    const [dsaSolved, setDsaSolved] = useState<number>(0);
    const [sqlSolved, setSqlSolved] = useState<number>(0);

    const [githubCommitted, setGithubCommitted] = useState<boolean>(false);
    const [xPosted, setXPosted] = useState<boolean>(false);
    const [mood, setMood] = useState<string>("🙂");
    const [tomorrowTask, setTomorrowTask] = useState<string>("");
    const [projectProgress, setProjectProgress] = useState<string>("");
    const [sleepHours, setSleepHours] = useState<number>(0);

    const [todayLogExists, setTodayLogExists] = useState(false);

    const [platform, setPlatform] = useState<"x" | "linkedin">("x");
    const [generating, setGenerating] = useState(false);
    const [aiPosts, setAIPosts] = useState<AIPost[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
        const todayStr = new Date().toISOString().split("T")[0];

        async function fetchInitial() {
            try {
                const [recent, todayLog] = await Promise.all([
                    getRecentLogs(),
                    getTodayLog(),
                ]);

                if (recent) {
                    setHistoryLogs(recent);
                }

                if (todayLog && todayLog.log_date === todayStr) {
                    setTodayLogExists(true);
                    setEnergy(todayLog.energy);
                    setLearnedToday(todayLog.learned_today);
                    setDsaSolved(todayLog.dsa_solved);
                    setSqlSolved(todayLog.sql_solved);
                    setGithubCommitted(todayLog.github_committed);
                    setXPosted(todayLog.x_posted);
                    setMood(todayLog.mood);
                    setTomorrowTask(todayLog.tomorrow_task);
                    setProjectProgress(todayLog.project_progress || "");
                    setSleepHours(todayLog.sleep_hours || 0);

                    // Map tasks safely
                    try {
                        let parsedTasks = todayLog.tasks as any;
                        if (typeof parsedTasks === 'string') parsedTasks = JSON.parse(parsedTasks);
                        const t1 = Array.isArray(parsedTasks) ? parsedTasks[0]?.text || "" : "";
                        const t2 = Array.isArray(parsedTasks) ? parsedTasks[1]?.text || "" : "";
                        const t3 = Array.isArray(parsedTasks) ? parsedTasks[2]?.text || "" : "";
                        setTasks([t1, t2, t3]);
                    } catch (e) {
                        setTasks(["", "", ""]);
                    }

                } else {
                    setTodayLogExists(false);
                }

                setSelectedHistoryDate(todayStr);
            } catch (err) {
                console.error("Failed to load logs", err);
            } finally {
                setLoading(false);
            }
        }

        fetchInitial();
    }, []);

    // Reminder Notification effect
    useEffect(() => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

        const checkNotification = () => {
            const now = new Date();
            const hour = now.getHours();
            if (hour >= 21 && !xPosted && Notification.permission === "granted") {
                new Notification("DEX — Evening Reminder", {
                    body: "Haven't posted on X yet today. Open Daily Log to generate your post! 🌙",
                    icon: "/favicon.ico"
                });
            }
        };

        checkNotification();

        // Check if 9:30 PM is upcoming today
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(21, 30, 0, 0);

        const msUntil = reminderTime.getTime() - now.getTime();
        let timeoutId: string | number | NodeJS.Timeout | undefined;

        if (msUntil > 0) {
            timeoutId = setTimeout(() => {
                checkNotification();
            }, msUntil);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [xPosted]);

    const handleSave = async () => {
        setSaving(true);
        const todayStr = new Date().toISOString().split("T")[0];
        try {
            const tasksJson = tasks.map(t => ({ text: t, done: false, description: "" }));

            await upsertTodayLog({
                log_date: todayStr,
                energy,
                learned_today: learnedToday,
                dsa_solved: dsaSolved,
                sql_solved: sqlSolved,
                github_committed: githubCommitted,
                x_posted: xPosted,
                mood,
                tomorrow_task: tomorrowTask,
                project_progress: projectProgress,
                sleep_hours: sleepHours,
                tasks: tasksJson as any
            } as any);

            // Refresh history
            const [recent] = await Promise.all([getRecentLogs()]);
            if (recent) setHistoryLogs(recent);

            setTodayLogExists(true);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setSaving(false);
        }
    };

    const handleGeneratePosts = async () => {
        if (!learnedToday || learnedToday.length <= 20) return;
        setGenerating(true);
        try {
            const response = await fetch("/api/generate-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ learned_today: learnedToday })
            });
            const data = await response.json();
            if (data.posts) {
                setAIPosts(data.posts);
            }
        } catch (error) {
            console.error("Failed to generate ai posts", error);
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyPost = (post: AIPost, index: number) => {
        navigator.clipboard.writeText(post.content + "\n\n" + post.hashtags.join(" "));
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const last14Days = useMemo(() => getLast14DaysDates(), []);

    const selectedHistoryLog = useMemo(() => {
        return historyLogs.find(l => l.log_date === selectedHistoryDate);
    }, [historyLogs, selectedHistoryDate]);

    // Skeleton
    if (loading) {
        return (
            <div className="flex h-full gap-0 bg-gray-50 dark:bg-[#080808] animate-pulse">
                <div className="hidden lg:block w-[200px] bg-white dark:bg-[#0D0D0D] border-r border-gray-200 dark:border-[#1A1A1A]" />
                <div className="flex-1 px-8 py-6 max-w-[680px] mx-auto space-y-6">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-[#1A1A1A] rounded-lg" />
                    <div className="h-[200px] w-full bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl" />
                    <div className="h-[400px] w-full bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl" />
                </div>
                <div className="hidden xl:block w-[320px] bg-white dark:bg-[#0D0D0D] border-l border-gray-200 dark:border-[#1A1A1A]" />
            </div>
        );
    }

    if (!mounted) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#080808] gap-0 overflow-hidden font-sans antialiased selection:bg-blue-100 dark:selection:bg-blue-900/30">
            {/* LEFT COLUMN — DAY HISTORY STRIP */}
            <aside className="hidden lg:flex w-[200px] bg-white dark:bg-[#0D0D0D] border-r border-gray-200 dark:border-[#1A1A1A] flex-col shrink-0 overflow-hidden">
                <div className="px-4 pt-6 pb-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-[#3F3F46]">
                        History
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2 thin-scrollbar">
                    {last14Days.map(({ dateStr, dayName, dayNum }) => {
                        const log = historyLogs.find(l => l.log_date === dateStr);
                        const isToday = dateStr === new Date().toISOString().split("T")[0];
                        const isSelected = selectedHistoryDate === dateStr;

                        let dotColor = "bg-gray-200 dark:bg-[#2A2A2A]";
                        if (log) {
                            dotColor = (log.github_committed && log.x_posted) ? "bg-green-500" : "bg-amber-400";
                        }

                        return (
                            <button
                                key={dateStr}
                                onClick={() => setSelectedHistoryDate(dateStr)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 mb-1 group",
                                    isSelected
                                        ? "bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20"
                                        : "hover:bg-gray-50 dark:hover:bg-[#111111] border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-sm font-mono font-bold w-6 text-center tabular-nums transition-colors",
                                        isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-[#F5F5F5]"
                                    )}>
                                        {dayNum}
                                    </span>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className={cn(
                                            "text-[11px] font-semibold transition-colors",
                                            isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-[#71717A]"
                                        )}>
                                            {dayName}
                                        </span>
                                        <span className="text-[9px] font-medium text-gray-400 dark:text-[#3F3F46]">
                                            {new Date(dateStr).toLocaleDateString("en-US", { month: "short" })}
                                        </span>
                                    </div>
                                </div>
                                <div className={cn("w-1.5 h-1.5 rounded-full ring-4 ring-offset-0 ring-transparent transition-all", dotColor)} />
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* CENTER COLUMN — MAIN LOG */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth thin-scrollbar">
                <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-8">

                    {/* HEADER ROW */}
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-[#F5F5F5] mb-1">
                                Daily Log
                            </h1>
                            <p className="text-sm font-medium text-gray-500 dark:text-[#71717A]">
                                {formatTodayDate()}
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={cn(
                                "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-bold tracking-tight transition-all duration-300 transform active:scale-95 group shadow-sm hover:shadow-md",
                                saved
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                            )}
                        >
                            {saving ? (
                                <RefreshCw className="size-4 animate-spin" />
                            ) : saved ? (
                                <Check className="size-4 stroke-[3]" />
                            ) : (
                                <Check className="size-4 stroke-[3]" />
                            )}
                            <span className="relative">
                                {saving ? "Saving..." : saved ? "Saved!" : "Save Log"}
                                {saved && <span className="absolute -top-1 -right-4 w-2 h-2 bg-white rounded-full animate-ping" />}
                            </span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* CARD 1: MORNING CHECK-IN */}
                        <div className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-[#1A1A1A] rounded-[2rem] p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100/50 dark:border-amber-500/20">
                                    <Sun className="size-5 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5]">Morning Check-in</h2>
                                    <p className="text-xs text-gray-400 dark:text-[#3F3F46] font-medium tracking-wide">LEVEL UP YOUR ENERGY</p>
                                </div>
                                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#1A1A1A]">
                                    <Clock className="size-3.5 text-gray-400 dark:text-[#3F3F46]" />
                                    <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-[#71717A]">
                                        {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* ENERGY SECTION */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-[11px] font-bold text-gray-400 dark:text-[#71717A] uppercase tracking-[0.1em]">
                                        Energy Intensity
                                    </label>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100/50 dark:border-blue-500/20">
                                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-[#7C3AED]">
                                            {energy}/10
                                        </span>
                                    </div>
                                </div>

                                <div className="relative group/slider px-2">
                                    <div className="relative h-2 w-full flex items-center">
                                        {/* Track */}
                                        <div className="h-full w-full rounded-full bg-gray-100 dark:bg-[#161616] overflow-hidden">
                                            {/* Fill */}
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#7C3AED] dark:to-[#6D28D9] rounded-full"
                                                initial={false}
                                                animate={{ width: `${(energy / 10) * 100}%` }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        </div>

                                        {/* Thumb Indicator */}
                                        <motion.div
                                            className="absolute w-5 h-5 rounded-full bg-white dark:bg-white border-[3px] border-blue-600 dark:border-[#7C3AED] shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 pointer-events-none"
                                            initial={false}
                                            animate={{ left: `calc(${(energy / 10) * 100}% - 10px)` }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />

                                        {/* Hidden Range Input */}
                                        <input
                                            type="range"
                                            min={1}
                                            max={10}
                                            step={1}
                                            value={energy}
                                            onChange={(e) => setEnergy(parseInt(e.target.value))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        />
                                    </div>

                                    {/* Emoji strip */}
                                    <div className="flex justify-between mt-4 px-1">
                                        {["😫", "😐", "😊", "😄", "🚀"].map((emoji, i) => {
                                            const step = i * 2.25 + 1;
                                            const active = Math.abs(energy - step) < 1.5;
                                            return (
                                                <span
                                                    key={i}
                                                    className={cn(
                                                        "text-xl transition-all duration-300",
                                                        active ? "scale-150 opacity-100 blur-0 translate-y-[-2px]" : "opacity-20 blur-[1px] scale-100"
                                                    )}
                                                >
                                                    {emoji}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* FOCUS + PRIORITIES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 dark:text-[#71717A] uppercase tracking-[0.1em] mb-4">
                                        DSA Focus Pattern
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {DSA_PATTERNS.map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setFocusPattern(p)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 border",
                                                    focusPattern === p
                                                        ? "bg-blue-600 dark:bg-[#7C3AED] text-white border-transparent shadow-[0_4px_12px_rgba(37,99,235,0.3)] dark:shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
                                                        : "bg-white dark:bg-transparent border-gray-200 dark:border-[#1A1A1A] text-gray-500 dark:text-[#71717A] hover:border-blue-400 dark:hover:border-blue-500/40"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 dark:text-[#71717A] uppercase tracking-[0.1em] mb-4">
                                        Top 3 Priorities
                                    </label>
                                    <div className="space-y-4">
                                        {[0, 1, 2].map((idx) => (
                                            <div key={idx} className="flex items-center gap-4 group">
                                                <div className="w-6 h-6 rounded-lg bg-blue-600/10 dark:bg-[#7C3AED]/10 flex items-center justify-center border border-blue-600/20 dark:border-[#7C3AED]/20">
                                                    <span className="text-[10px] font-black text-blue-600 dark:text-[#7C3AED]">
                                                        {idx + 1}
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={tasks[idx]}
                                                    onChange={(e) => {
                                                        const nt = [...tasks];
                                                        nt[idx] = e.target.value;
                                                        setTasks(nt);
                                                    }}
                                                    placeholder={`Priority ${idx + 1}...`}
                                                    className="flex-1 bg-transparent border-b border-gray-100 dark:border-[#1A1A1A] py-1 text-sm text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-200 dark:placeholder:text-[#2A2A2A] outline-none focus:border-blue-500 dark:focus:border-[#7C3AED] transition-colors"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: EVENING RECAP */}
                        <div className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-[#1A1A1A] rounded-[2rem] p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-500/20">
                                    <Moon className="size-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5]">Evening Recap</h2>
                                    <p className="text-xs text-gray-400 dark:text-[#3F3F46] font-medium tracking-wide">SHARPEN YOUR REFLECTION</p>
                                </div>
                                <div className="ml-auto text-[11px] font-mono font-bold text-gray-300 dark:text-[#2A2A2A]">
                                    {[dsaSolved, sqlSolved, githubCommitted, xPosted, learnedToday, mood].filter(x => x === true || (typeof x === 'string' && x.length > 0) || (typeof x === 'number' && x > 0)).length} / 6 FILLED
                                </div>
                            </div>

                            {/* NUMBERS ROW */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: "DSA", icon: Code2, value: dsaSolved, onChange: (v: any) => setDsaSolved(Number(v)), color: "text-blue-500" },
                                    { label: "SQL", icon: Database, value: sqlSolved, onChange: (v: any) => setSqlSolved(Number(v)), color: "text-green-500" },
                                    { label: "Commit", icon: Github, value: githubCommitted, isToggle: true, onToggle: (v: any) => setGithubCommitted(Boolean(v)), color: "text-gray-900 dark:text-white" },
                                    { label: "Hours", icon: Clock, value: sleepHours, isNumber: true, onChange: (v: any) => setSleepHours(Number(v)), color: "text-purple-500" },
                                ].map((stat, i) => (
                                    <div key={i} className="flex flex-col items-center p-4 rounded-3xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#1A1A1A] group/stat hover:border-gray-300 dark:hover:border-[#222] transition-colors">
                                        <stat.icon className={cn("size-4 mb-3 opacity-60 group-hover/stat:opacity-100 transition-opacity", stat.color)} />
                                        {stat.isToggle ? (
                                            <button
                                                onClick={() => stat.onToggle!(!stat.value)}
                                                className={cn(
                                                    "w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1",
                                                    stat.value ? "bg-blue-600 shadow-[0_4px_10px_rgba(37,99,235,0.4)]" : "bg-gray-200 dark:bg-[#1F1F1F]"
                                                )}
                                            >
                                                <motion.div
                                                    className="size-4 rounded-full bg-white shadow-sm"
                                                    animate={{ x: stat.value ? 16 : 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            </button>
                                        ) : (
                                            <input
                                                type="number"
                                                value={typeof stat.value === 'number' ? stat.value : 0}
                                                onChange={(e) => stat.onChange!(parseInt(e.target.value) || 0)}
                                                className="w-full text-center bg-transparent border-none outline-none text-xl font-black font-mono text-gray-900 dark:text-white"
                                            />
                                        )}
                                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-[#3F3F46] mt-2 group-hover/stat:text-gray-600 dark:group-hover/stat:text-[#555] transition-colors">
                                            {stat.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* WHAT YOU LEARNED */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[11px] font-bold text-gray-400 dark:text-[#71717A] uppercase tracking-[0.1em]">
                                        What did you learn today?
                                    </label>
                                    <button
                                        onClick={() => document.getElementById('post-panel')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-[10px] font-black text-blue-600 dark:text-[#7C3AED] uppercase tracking-wider hover:underline"
                                    >
                                        Draft Nightly Post →
                                    </button>
                                </div>
                                <div className="relative group">
                                    <textarea
                                        value={learnedToday}
                                        onChange={(e) => setLearnedToday(e.target.value)}
                                        placeholder="Write freely — Navi will convert this into your scheduled nightly posts..."
                                        className="w-full min-h-[160px] bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#1A1A1A] rounded-[1.5rem] p-5 text-sm leading-relaxed text-gray-800 dark:text-[#E5E7EB] placeholder:text-gray-300 dark:placeholder:text-[#2A2A2A] outline-none focus:border-blue-400 dark:focus:border-[#7C3AED] focus:ring-[4px] focus:ring-blue-500/5 dark:focus:ring-[#7C3AED]/5 transition-all resize-none"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-mono font-bold text-gray-300 dark:text-[#2A2A2A]">
                                        {learnedToday.length} CHARS
                                    </div>
                                </div>
                            </div>

                            {/* MOOD + TOGGLES ROW */}
                            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 border-t border-gray-100 dark:border-[#1A1A1A]">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-gray-300 dark:text-[#3F3F46] uppercase tracking-[0.1em]">Mood</span>
                                    <div className="flex items-center gap-2">
                                        {MOOD_EMOJIS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => setMood(emoji)}
                                                className={cn(
                                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all duration-300",
                                                    mood === emoji
                                                        ? "bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500/30 scale-125 shadow-sm"
                                                        : "opacity-30 hover:opacity-60 grayscale hover:grayscale-0 hover:scale-110"
                                                )}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="sm:ml-auto flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-[#3F3F46] uppercase tracking-wider">X Posted</span>
                                        <button
                                            onClick={() => setXPosted(!xPosted)}
                                            className={cn(
                                                "w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1",
                                                xPosted ? "bg-blue-600 shadow-[0_4px_10px_rgba(37,99,235,0.4)]" : "bg-gray-200 dark:bg-[#1F1F1F]"
                                            )}
                                        >
                                            <motion.div
                                                className="size-4 rounded-full bg-white shadow-sm"
                                                animate={{ x: xPosted ? 16 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* RIGHT COLUMN — TONIGHT'S POST PANEL */}
            <aside id="post-panel" className="hidden xl:flex w-[320px] bg-white dark:bg-[#0D0D0D] border-l border-gray-200 dark:border-[#1A1A1A] flex-col shrink-0 overflow-hidden">
                <div className="px-6 pt-8 pb-6 border-b border-gray-50 dark:border-[#1A1A1A]">
                    <div className="flex items-center gap-2.5 mb-6">
                        <Sparkles className="size-4 text-purple-600 dark:text-[#A78BFA]" />
                        <h2 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight">Tonight&apos;s Post</h2>
                        <div className="ml-auto px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-[#A78BFA] uppercase tracking-wider">Gemini</span>
                        </div>
                    </div>

                    <div className="flex p-1 bg-gray-50 dark:bg-[#111111] rounded-[1rem] border border-gray-100 dark:border-[#1A1A1A]">
                        <button
                            onClick={() => setPlatform("x")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                                platform === "x"
                                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                                    : "text-gray-400 dark:text-[#3F3F46] hover:text-gray-600"
                            )}
                        >
                            𝕏 X
                        </button>
                        <button
                            onClick={() => setPlatform("linkedin")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                                platform === "linkedin"
                                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                                    : "text-gray-400 dark:text-[#3F3F46] hover:text-gray-600"
                            )}
                        >
                            in LinkedIn
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <button
                        onClick={handleGeneratePosts}
                        disabled={generating || !learnedToday}
                        className={cn(
                            "w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-black transition-all transform active:scale-95 text-white",
                            generating || !learnedToday
                                ? "bg-gray-200 dark:bg-[#1A1A1A] text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)]"
                        )}
                    >
                        {generating ? (
                            <RefreshCw className="size-4 animate-spin" />
                        ) : (
                            <Sparkles className="size-4" />
                        )}
                        {generating ? "Generating..." : "Generate Post Ideas"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 thin-scrollbar">
                    {aiPosts.length > 0 ? (
                        aiPosts.map((post, idx) => (
                            <div
                                key={idx}
                                className="group p-5 rounded-[1.5rem] bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#1A1A1A] hover:border-blue-200 dark:hover:border-[#7C3AED]/30 transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-2 py-0.5 rounded-lg bg-blue-100/50 dark:bg-blue-500/10 text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                        {post.type}
                                    </span>
                                    <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-[#3F3F46]">
                                        {post.content.length} CHARS
                                    </span>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-[#D4D4D8] leading-[1.6] mb-4 line-clamp-6">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyPost(post, idx);
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0D0D0D] border border-gray-100 dark:border-[#1A1A1A] text-[10px] font-bold text-gray-600 dark:text-[#71717A] hover:bg-gray-50 transition-colors"
                                    >
                                        <Copy className="size-3" />
                                        {copiedIndex === idx ? "Copied!" : "Copy"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams({
                                                draft: "true",
                                                platform: platform,
                                                content: post.content + "\n\n" + post.hashtags.join(" ")
                                            });
                                            window.location.href = `/post-lab?${params.toString()}`;
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 dark:text-[#7C3AED] hover:underline"
                                    >
                                        Edit in Post Lab
                                        <ArrowRight className="size-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : !generating && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#1A1A1A] flex items-center justify-center mb-4">
                                <FileText className="size-6 text-gray-400 dark:text-[#3F3F46]" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">No posts yet</h4>
                            <p className="text-xs text-gray-500 dark:text-[#71717A] max-w-[180px] leading-relaxed">
                                Fill in what you learned & click Generate to begin
                            </p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}

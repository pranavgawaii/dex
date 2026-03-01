"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, Sparkles, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { getRecentLogs, DailyLog } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ── Week date helpers ──
function getWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
}

function formatDate(d: Date) {
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function getDatesBetween(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
        dates.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

function buildStreakGrid(logs: DailyLog[], key: keyof DailyLog): { date: string; active: boolean; isFuture: boolean }[] {
    const today = new Date();
    const cells = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const log = logs.find(l => l.log_date === ds);
        cells.push({ date: ds, active: !!(log && log[key]), isFuture: false });
    }
    return cells;
}

const GOAL_KEY = "dex-weekly-goals";
const REFLECTION_KEY = "dex-weekly-reflection";

export default function WeeklyReviewPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<DailyLog[]>([]);

    const [reflection, setReflection] = useState({ well: "", didnt: "", different: "" });
    const [goals, setGoals] = useState(["", "", ""]);
    const [savedReflection, setSavedReflection] = useState(false);
    const [savedGoals, setSavedGoals] = useState(false);

    const [insight, setInsight] = useState<string | null>(null);
    const [loadingInsight, setLoadingInsight] = useState(false);

    const { monday, sunday } = getWeekRange();
    const weekDates = getDatesBetween(monday, sunday);

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem(REFLECTION_KEY);
        if (saved) setReflection(JSON.parse(saved));
        const savedG = localStorage.getItem(GOAL_KEY);
        if (savedG) setGoals(JSON.parse(savedG));

        getRecentLogs().then(data => {
            setLogs(data ? [...data].reverse() : []);
            setLoading(false);
        });
    }, []);

    const weekLogs = logs.filter(l => weekDates.includes(l.log_date));

    // Auto-summary stats
    const dsaSolved = weekLogs.reduce((sum, l) => sum + (l.dsa_solved || 0), 0);
    const sqlSolved = weekLogs.reduce((sum, l) => sum + (l.sql_solved || 0), 0);
    const swimDays = weekLogs.filter(l => l.workout).length;
    const xPosted = weekLogs.filter(l => l.x_posted).length;
    const ghCommits = weekLogs.filter(l => l.github_committed).length;
    const logsThisWeek = weekLogs.length;

    const summaryItems = [
        { label: "DSA Solved", value: `${dsaSolved} problems`, icon: "🧠", good: dsaSolved >= 5 },
        { label: "SQL Solved", value: `${sqlSolved} problems`, icon: "🗄️", good: sqlSolved >= 2 },
        { label: "Swim Days", value: `${swimDays} / 7 days`, icon: "🏊", good: swimDays >= 4 },
        { label: "X Posts", value: `${xPosted} / 7 days`, icon: "📱", good: xPosted >= 5 },
        { label: "GitHub Commits", value: `${ghCommits} days`, icon: "💻", good: ghCommits >= 5 },
        { label: "Daily Logs", value: `${logsThisWeek} / 7 days`, icon: "📓", good: logsThisWeek >= 5 },
    ];

    const handleSaveReflection = () => {
        localStorage.setItem(REFLECTION_KEY, JSON.stringify(reflection));
        setSavedReflection(true);
        setTimeout(() => setSavedReflection(false), 2000);
    };

    const handleSaveGoals = () => {
        localStorage.setItem(GOAL_KEY, JSON.stringify(goals));
        setSavedGoals(true);
        setTimeout(() => setSavedGoals(false), 2000);
    };

    const handleGenerateInsight = async () => {
        setLoadingInsight(true);
        try {
            const context = `Weekly stats for Pranav:
DSA: ${dsaSolved} problems solved
SQL: ${sqlSolved} problems solved
Swim: ${swimDays}/7 days
X Posts: ${xPosted}/7 days
GitHub: ${ghCommits} days with commits
Daily Logs: ${logsThisWeek}/7 days
Reflection — What went well: ${reflection.well}
What didn't go well: ${reflection.didnt}`;

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_KEY || ''}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `You are a personal productivity coach for a CS student aiming for placement. Analyse this week and give exactly 3 sharp insights as bullet points (•). Be specific, data-driven, and motivating. Max 60 words total.\n\n${context}` }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            setInsight(text || generateFallbackInsight());
        } catch {
            setInsight(generateFallbackInsight());
        } finally {
            setLoadingInsight(false);
        }
    };

    const generateFallbackInsight = () =>
        `• You solved ${dsaSolved} DSA problems this week — ${dsaSolved >= 5 ? "great momentum! Keep pushing to 7+" : "aim for at least 7 next week."}\n• Swim streak: ${swimDays}/7 days — ${swimDays >= 5 ? "excellent consistency!" : "try to hit 5 days next week 🏊"}\n• GitHub commits: ${ghCommits}/7 — ${ghCommits >= 5 ? "solid dev habit!" : "commit something small every day, even docs."}`;

    const streakRows = [
        { label: "GitHub 💻", grid: buildStreakGrid(logs, "github_committed") },
        { label: "Swim 🏊", grid: buildStreakGrid(logs, "workout") },
        { label: "Daily Log 📓", grid: buildStreakGrid(logs, "log_date" as any) },
        { label: "X Posted 📱", grid: buildStreakGrid(logs, "x_posted") },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-[1100px] mx-auto space-y-6 pb-12 animate-fade-in">

            {/* HEADER */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                    <CalendarCheck size={24} />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight font-geist">Weekly Review</h1>
                    <p className="text-sm text-gray-500 dark:text-[#71717A] mt-0.5">
                        Week of {formatDate(monday)} – {formatDate(sunday)}
                    </p>
                </div>
            </div>

            {/* ── AUTO SUMMARY ── */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5] mb-5">📊 Week Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {summaryItems.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border",
                                item.good
                                    ? "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30"
                                    : "bg-gray-50 dark:bg-[#0D0D0D] border-gray-100 dark:border-[#1F1F1F]"
                            )}
                        >
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-[#71717A]">{item.label}</p>
                                <p className={cn("text-sm font-semibold", item.good ? "text-green-700 dark:text-green-400" : "text-gray-800 dark:text-[#F5F5F5]")}>
                                    {item.value} {item.good ? "✅" : ""}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── REFLECTION ── */}
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5]">📝 Reflection</h2>
                    {[
                        { key: "well", label: "What went well this week?" },
                        { key: "didnt", label: "What didn't go well?" },
                        { key: "different", label: "What will I do differently?" },
                    ].map(f => (
                        <div key={f.key} className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wide">{f.label}</label>
                            <textarea
                                value={reflection[f.key as keyof typeof reflection]}
                                onChange={e => setReflection(r => ({ ...r, [f.key]: e.target.value }))}
                                placeholder="Type your thoughts..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-gray-50 dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40 resize-none"
                            />
                        </div>
                    ))}
                    <button
                        onClick={handleSaveReflection}
                        className={cn("w-full py-2.5 rounded-xl font-medium text-sm transition-colors",
                            savedReflection ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}
                    >
                        {savedReflection ? "✓ Saved!" : "Save Reflection"}
                    </button>
                </div>

                {/* ── NEXT WEEK GOALS ── */}
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5]">🎯 Next Week Goals</h2>
                    <p className="text-xs text-gray-500 dark:text-[#71717A]">These will sync to your Home dashboard</p>
                    <div className="space-y-3">
                        {goals.map((g, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <input
                                    value={g}
                                    onChange={e => { const n = [...goals]; n[i] = e.target.value; setGoals(n); }}
                                    placeholder={["Solve 10 DSA problems", "Apply to 5 companies", "Swim 5 days"][i]}
                                    className="flex-1 h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-gray-50 dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleSaveGoals}
                        className={cn("w-full py-2.5 rounded-xl font-medium text-sm transition-colors",
                            savedGoals ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}
                    >
                        {savedGoals ? "✓ Goals Saved!" : "Save Goals for Next Week"}
                    </button>
                </div>
            </div>

            {/* ── STREAK OVERVIEW ── */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5] mb-5">🔥 Streak Overview (Last 28 Days)</h2>
                <div className="space-y-4">
                    {streakRows.map((row, ri) => (
                        <div key={ri} className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-gray-500 dark:text-[#71717A] w-24 shrink-0">{row.label}</span>
                            <div className="flex gap-1 flex-wrap">
                                {row.grid.map((cell, ci) => (
                                    <div
                                        key={ci}
                                        title={cell.date}
                                        className={cn("w-5 h-5 rounded-sm transition-colors",
                                            cell.isFuture ? "bg-gray-50 dark:bg-[#1A1A1A]"
                                                : cell.active ? "bg-blue-500 dark:bg-blue-600"
                                                    : "bg-gray-100 dark:bg-[#1F1F1F]"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-[#71717A] shrink-0">
                                {row.grid.filter(c => c.active && !c.isFuture).length} days
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── AI WEEKLY INSIGHT ── */}
            <div className="bg-blue-50/50 dark:bg-[#0D0D12] border border-blue-100 dark:border-blue-900/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5] flex items-center gap-2">
                        <Sparkles size={18} className="text-blue-600 dark:text-blue-400" /> AI Weekly Insight
                    </h2>
                    <button
                        onClick={handleGenerateInsight}
                        disabled={loadingInsight}
                        className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loadingInsight ? <><Loader2 size={14} className="animate-spin" /> Analysing...</> : <><Sparkles size={14} /> Generate Insight</>}
                    </button>
                </div>
                {insight ? (
                    <div className="space-y-2">
                        {insight.split("\n").filter(l => l.trim()).map((line, i) => (
                            <p key={i} className="text-sm text-gray-700 dark:text-[#A1A1AA] leading-relaxed">{line}</p>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-[#71717A]">
                        Fill in your reflection and click "Generate Insight" — DEX will analyse your week and give you 3 sharp, data-driven pointers.
                    </p>
                )}
            </div>

        </div>
    );
}

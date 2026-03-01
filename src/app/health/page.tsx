"use client";

import { useState, useEffect } from "react";
import { Footprints, Droplets, Scale, Dumbbell, TrendingDown, CheckCircle2, Circle } from "lucide-react";
import { getTodayLog, getRecentLogs, upsertTodayLog, DailyLog } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, CartesianGrid
} from "recharts";
import { motion } from "framer-motion";

// ── Weight log seed (Sunday weigh-ins only) ──
const WEIGHT_HISTORY = [
    { date: "2026-02-02", weight: 84.0 },
    { date: "2026-02-09", weight: 83.5 },
    { date: "2026-02-16", weight: 83.2 },
];
const WEIGHT_TARGET = 70;
const WEIGHT_START = 84;

// ── 6-Month milestones ──
const MILESTONES = [
    { month: "Feb", target: 84, label: "Start" },
    { month: "Mar", target: 82, label: "82 kg" },
    { month: "Apr", target: 80, label: "80 kg" },
    { month: "May", target: 77, label: "77 kg" },
    { month: "Jun", target: 74, label: "74 kg" },
    { month: "Jul", target: 72, label: "72 kg" },
    { month: "Aug", target: 70, label: "Goal 🎯" },
];

function getWeekGrid(logs: DailyLog[]) {
    const today = new Date();
    const days: { date: string; swam: boolean; isFuture: boolean }[] = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const log = logs.find(l => l.log_date === dateStr);
        days.push({ date: dateStr, swam: log?.workout ?? false, isFuture: false });
    }
    // add a few future days grayed
    for (let i = 1; i <= 6; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push({ date: d.toISOString().split("T")[0], swam: false, isFuture: true });
    }
    return days;
}

export default function HealthPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [steps, setSteps] = useState(0);
    const [water, setWater] = useState(0);
    const [swam, setSwam] = useState(false);
    const [ateclean, setAteClean] = useState(true);

    const [todayStr, setTodayStr] = useState("");
    const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);

    // Weight log
    const [weightHistory, setWeightHistory] = useState(WEIGHT_HISTORY);
    const [newWeight, setNewWeight] = useState<number | "">("");
    const [weightDate, setWeightDate] = useState("");

    useEffect(() => {
        setMounted(true);
        const today = new Date();
        const todayDateStr = today.toISOString().split("T")[0];
        setTodayStr(todayDateStr);
        setWeightDate(todayDateStr);

        Promise.all([getTodayLog(), getRecentLogs()]).then(([todayLog, recents]) => {
            if (todayLog?.log_date === todayDateStr) {
                setSteps(todayLog.steps || 0);
                setWater(todayLog.water || 0);
                setSwam(todayLog.workout || false);
            }
            setRecentLogs(recents ? [...recents].reverse() : []);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await upsertTodayLog({ log_date: todayStr, steps, water, workout: swam });
        setSaved(true);
        import("@/lib/confetti").then(m => m.triggerConfetti());
        setTimeout(() => setSaved(false), 2000);
        setSaving(false);
    };

    const handleSaveWeight = () => {
        if (!newWeight) return;
        const entry = { date: weightDate, weight: Number(newWeight) };
        // Replace if same date, else append
        setWeightHistory(prev => {
            const filtered = prev.filter(w => w.date !== weightDate);
            return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
        });
        setNewWeight("");
    };

    const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : WEIGHT_START;
    const weightLost = +(WEIGHT_START - latestWeight).toFixed(1);
    const weightProgress = Math.min(100, (weightLost / (WEIGHT_START - WEIGHT_TARGET)) * 100);

    // Swim streak
    const weekGrid = getWeekGrid(recentLogs);
    let swimStreak = 0;
    const todayIdx = weekGrid.findIndex(d => d.date === todayStr);
    for (let i = todayIdx; i >= 0; i--) {
        if (weekGrid[i].swam) swimStreak++;
        else break;
    }

    // Current milestone
    const currentMonth = new Date().toLocaleString("en", { month: "short" });
    const currentMilestoneIdx = MILESTONES.findIndex(m => m.month === currentMonth);

    const chartData = weightHistory.map(w => ({
        date: new Date(w.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
        weight: w.weight,
        target: WEIGHT_TARGET,
    }));

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!mounted) return null;

    return (
        <div className="max-w-[1100px] mx-auto space-y-6 pb-12 animate-fade-in">

            {/* PAGE HEADER */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                    <Scale size={24} />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight font-geist">
                        Health Tracker
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-[#71717A] mt-0.5">
                        84kg → 70kg by Aug 2026 · Swim every day
                    </p>
                </div>
            </div>

            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Current Weight", value: `${latestWeight} kg`, icon: <Scale size={16} />, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" },
                    { label: "Weight Lost", value: weightLost > 0 ? `-${weightLost} kg` : "0 kg", icon: <TrendingDown size={16} />, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30" },
                    { label: "Swim Streak", value: `${swimStreak} days 🏊`, icon: <Dumbbell size={16} />, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30" },
                    { label: "Steps Today", value: steps.toLocaleString(), icon: <Footprints size={16} />, color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30" },
                    { label: "Water Today", value: `${water}/8 glasses`, icon: <Droplets size={16} />, color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30" },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4"
                    >
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-3", s.color)}>{s.icon}</div>
                        <p className="text-lg font-bold text-gray-900 dark:text-[#F5F5F5] font-geist">{s.value}</p>
                        <p className="text-xs text-gray-500 dark:text-[#71717A] mt-0.5">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── WEIGHT LOG CARD ── */}
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                    <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5] mb-1">Weight Log</h2>
                    <p className="text-xs text-gray-500 dark:text-[#71717A] mb-5">Sunday weigh-ins only · Target: 70 kg by Aug 2026</p>

                    <div className="flex gap-3 mb-5">
                        <input
                            type="number"
                            step="0.1"
                            min={60}
                            max={120}
                            value={newWeight}
                            onChange={e => setNewWeight(e.target.value ? +e.target.value : "")}
                            placeholder="e.g. 83.2"
                            className="flex-1 h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                        />
                        <input
                            type="date"
                            value={weightDate}
                            onChange={e => setWeightDate(e.target.value)}
                            className="h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                        />
                        <button
                            onClick={handleSaveWeight}
                            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Save
                        </button>
                    </div>

                    <div className="mb-2 flex justify-between text-xs text-gray-500 dark:text-[#71717A]">
                        <span>Progress to 70 kg</span>
                        <span>{latestWeight} kg → 70 kg</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-[#1F1F1F] rounded-full overflow-hidden mb-5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${weightProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                        />
                    </div>

                    <div className="space-y-2 max-h-36 overflow-y-auto">
                        {[...weightHistory].reverse().map((w, i) => (
                            <div key={i} className="flex items-center justify-between text-sm px-1">
                                <span className="text-gray-500 dark:text-[#71717A]">{new Date(w.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</span>
                                <span className="font-semibold text-gray-900 dark:text-[#F5F5F5]">{w.weight} kg</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── WEIGHT CHART ── */}
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                    <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5] mb-1">Weight Trend</h2>
                    <p className="text-xs text-gray-500 dark:text-[#71717A] mb-4">Dotted line = 70 kg target</p>
                    {chartData.length < 2 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-gray-400">Log 2+ weigh-ins to see your trend 📈</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[stroke:#1F1F1F]" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717A' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[68, 86]} tick={{ fontSize: 11, fill: '#71717A' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#fff', fontSize: 12 }}
                                    formatter={(v: any) => [`${v} kg`]}
                                />
                                <ReferenceLine y={WEIGHT_TARGET} strokeDasharray="4 4" stroke="#2563EB" strokeOpacity={0.5} label="" />
                                <Line type="monotone" dataKey="weight" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── DAILY LOG CARD ── */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5] mb-5">Today's Log</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                    {/* Swim */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Swim Today?</p>
                        <div className="flex gap-2">
                            {[true, false].map(val => (
                                <button
                                    key={String(val)}
                                    onClick={() => setSwam(val)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                                        swam === val
                                            ? val ? "bg-blue-600 text-white border-transparent" : "bg-red-500 text-white border-transparent"
                                            : "bg-white dark:bg-[#0D0D0D] text-gray-600 dark:text-[#A1A1AA] border-gray-200 dark:border-[#1F1F1F]"
                                    )}
                                >
                                    {val ? "Yes 🏊" : "No"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Steps</p>
                        <input
                            type="number" min={0} max={50000} step={100}
                            value={steps}
                            onChange={e => setSteps(Number(e.target.value))}
                            className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                        />
                        <div className="h-1.5 bg-gray-100 dark:bg-[#1F1F1F] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (steps / 8000) * 100)}%` }} />
                        </div>
                    </div>

                    {/* Water */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Water ({water}/8 glasses)</p>
                        <div className="grid grid-cols-4 gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                <button key={n} onClick={() => setWater(n === water ? n - 1 : n)} className="flex justify-center">
                                    <Droplets className={cn("size-5 transition-colors", n <= water ? "text-blue-500" : "text-gray-200 dark:text-[#1F1F1F] hover:text-blue-300")} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Meals */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Meals</p>
                        <div className="flex gap-2">
                            {[{ val: true, label: "Ate clean 🥗" }, { val: false, label: "Had cheat 🍕" }].map(m => (
                                <button
                                    key={String(m.val)}
                                    onClick={() => setAteClean(m.val)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-xs font-medium transition-colors border",
                                        ateclean === m.val
                                            ? "bg-blue-600 text-white border-transparent"
                                            : "bg-white dark:bg-[#0D0D0D] text-gray-600 dark:text-[#A1A1AA] border-gray-200 dark:border-[#1F1F1F]"
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "mt-6 w-full py-3 rounded-xl font-medium text-sm transition-colors",
                        saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
                    )}
                >
                    {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Today's Health Data"}
                </button>
            </div>

            {/* ── SWIM STREAK CALENDAR ── */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5]">Swim Streak</h2>
                        <p className="text-xs text-gray-500 dark:text-[#71717A]">Current: {swimStreak} days 🏊 · Green = swam · Red = missed</p>
                    </div>
                    <span className="text-2xl font-bold font-geist text-gray-900 dark:text-[#F5F5F5]">{swimStreak} <span className="text-sm font-normal text-gray-500">days</span></span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {weekGrid.map((day, i) => (
                        <div
                            key={i}
                            title={day.date}
                            className={cn(
                                "w-7 h-7 rounded-md transition-colors",
                                day.isFuture
                                    ? "bg-gray-50 dark:bg-[#1A1A1A] border border-dashed border-gray-200 dark:border-[#2A2A2A]"
                                    : day.swam
                                        ? "bg-blue-500 dark:bg-blue-600"
                                        : "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* ── 6-MONTH TIMELINE ── */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5] mb-6">6-Month Weight Milestones</h2>
                <div className="relative">
                    {/* connector line */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100 dark:bg-[#1F1F1F]" />
                    <div className="flex justify-between relative">
                        {MILESTONES.map((m, i) => {
                            const isActive = i === currentMilestoneIdx;
                            const isPast = i < currentMilestoneIdx;
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 text-center relative z-10">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                        isActive ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30"
                                            : isPast ? "bg-green-500 border-green-500 text-white"
                                                : "bg-white dark:bg-[#111111] border-gray-200 dark:border-[#1F1F1F] text-gray-400"
                                    )}>
                                        {isPast ? <CheckCircle2 size={18} /> : isActive ? <span className="text-xs font-bold">{m.target}</span> : <Circle size={18} />}
                                    </div>
                                    <span className={cn("text-xs font-semibold", isActive ? "text-blue-600 dark:text-blue-400" : isPast ? "text-green-600 dark:text-green-500" : "text-gray-400 dark:text-[#52525B]")}>{m.month}</span>
                                    <span className={cn("text-[10px]", isActive ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-400 dark:text-[#52525B]")}>{m.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}

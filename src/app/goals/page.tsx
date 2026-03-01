"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { getMetrics, updateMetric, Metric } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const CountUp = ({ to, duration = 1 }: { to: number; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = parseInt(to.toString(), 10) || 0;
        if (start === end) {
            setCount(end);
            return;
        }

        let totalMilSecDur = duration * 1000;
        let incrementTime = (totalMilSecDur / end) * 0.5;

        // guard against infinite interval
        if (incrementTime < 10) incrementTime = 10;
        const step = Math.max(1, Math.floor(end / (totalMilSecDur / incrementTime)));

        let timer = setInterval(() => {
            start += step;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, incrementTime);
        return () => clearInterval(timer);
    }, [to, duration]);

    return <span>{count}</span>;
};

const IconByName = ({ name, className }: { name: string; className?: string }) => {
    const Icon = (LucideIcons as any)[name] || LucideIcons.Circle;
    return <Icon className={className} />;
};

export default function GoalsPage() {
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const [daysRemaining, setDaysRemaining] = useState(0);
    const [journeyPercent, setJourneyPercent] = useState(0);
    const [elapsedDays, setElapsedDays] = useState(0);

    useEffect(() => {
        const fetchMetrics = async () => {
            const data = await getMetrics();
            setMetrics(data);
            setLoading(false);
        };
        fetchMetrics();

        const end = new Date("2026-08-31").getTime();
        const start = new Date("2026-02-20").getTime();
        const now = new Date().getTime();

        const remaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
        const elapsed = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
        const total = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        setDaysRemaining(remaining);
        setElapsedDays(elapsed);
        setJourneyPercent(Math.min(100, Math.max(0, (elapsed / total) * 100)));
    }, []);

    const handleSaveEdit = async (key: string) => {
        const newVal = editValue;
        setMetrics(metrics.map(m => m.metric_key === key ? { ...m, current_value: newVal } : m));
        setEditingKey(null);
        await updateMetric(key, newVal);
    };

    const getMetricMap = () => {
        const map: Record<string, number> = {};
        metrics.forEach(m => map[m.metric_key] = m.current_value);
        return map;
    };
    const mmap = getMetricMap();

    const milestones = [
        {
            month: "Feb 2026",
            status: "past",
            items: [
                { text: "NeetCode 50 done", done: (mmap.lc_solved || 0) >= 50 },
                { text: "SQL Phase 1 done", done: (mmap.sql_done || 0) >= 15 },
                { text: "First GSoC PR", done: (mmap.gsoc_prs || 0) >= 1 },
                { text: "100 LI followers added", done: (mmap.li_followers || 0) >= 900 },
            ]
        },
        {
            month: "Mar 2026",
            status: "current",
            items: [
                { text: "NeetCode 100 done", done: (mmap.lc_solved || 0) >= 100 },
                { text: "SQL Phase 2 done", done: (mmap.sql_done || 0) >= 30 },
                { text: "PlacePro launch", done: (mmap.github_stars || 0) >= 10 },
                { text: "X 200 followers", done: (mmap.x_followers || 0) >= 200 },
            ]
        },
        {
            month: "Apr 2026",
            status: "future",
            items: [
                { text: "NeetCode 150 done", done: (mmap.lc_solved || 0) >= 150 },
                { text: "SQL complete", done: (mmap.sql_done || 0) >= 50 },
                { text: "2 certs done", done: (mmap.certs || 0) >= 2 },
                { text: "20 mock interviews", done: (mmap.mock_interviews || 0) >= 20 },
            ]
        },
        {
            month: "May 2026",
            status: "future",
            items: [
                { text: "10 applications sent", done: (mmap.applications || 0) >= 10 },
                { text: "5 referrals", done: false },
                { text: "Open source 2 PRs", done: (mmap.gsoc_prs || 0) >= 2 },
                { text: "Portfolio live", done: false },
            ]
        },
        {
            month: "Jun 2026",
            status: "future",
            items: [
                { text: "30 applications", done: (mmap.applications || 0) >= 30 },
                { text: "5 interviews", done: false },
                { text: "Final year project demo ready", done: false },
            ]
        },
        {
            month: "Jul/Aug 2026",
            status: "future",
            items: [
                { text: "Offer or internship conversion 🎯", done: false },
            ]
        }
    ];

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white rounded-xl p-6 mb-6">
                <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-3xl">🎯</span>
                    <h1 className="text-xl font-bold mt-2">First Offer by August 31, 2026</h1>

                    <div className="mt-4 flex items-baseline">
                        <span className="text-5xl font-bold font-geist">{daysRemaining}</span>
                        <span className="text-lg opacity-80 ml-2">days remaining</span>
                    </div>

                    <p className="text-sm opacity-70 mt-3">
                        Feb 20 → Aug 31 = {elapsedDays} days | {Math.round(journeyPercent)}% of journey complete
                    </p>
                    <div className="w-64 h-1 bg-white/20 rounded mt-2 overflow-hidden mx-auto">
                        <div className="h-full bg-white/80 rounded" style={{ width: `${journeyPercent}%` }} />
                    </div>
                </div>
            </div>

            {/* North Star Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.map((metric) => {
                    const progress = Math.min(100, (metric.current_value / metric.target_value) * 100);
                    return (
                        <div key={metric.id} className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-5 relative group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <IconByName name={metric.icon} className="size-4 text-gray-500 dark:text-[#71717A]" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5]">{metric.metric_name}</h3>
                                </div>
                                <button
                                    onClick={() => { setEditingKey(metric.metric_key); setEditValue(metric.current_value); }}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1A1A2E] text-gray-400 dark:text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <LucideIcons.Pencil className="size-[14px]" />
                                </button>
                            </div>

                            {editingKey === metric.metric_key ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="number"
                                        min={0}
                                        value={editValue}
                                        onChange={(e) => setEditValue(Number(e.target.value))}
                                        className="w-24 bg-gray-50 dark:bg-[#0D0D0D] border border-gray-200 dark:border-[#1F1F1F] rounded-lg px-2 py-1 text-xl font-bold font-geist text-gray-900 dark:text-[#F5F5F5] outline-none focus:border-blue-400 dark:focus:border-blue-500/60"
                                        autoFocus
                                    />
                                    <button onClick={() => handleSaveEdit(metric.metric_key)} className="p-1 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 rounded-md hover:bg-green-100 dark:hover:bg-green-500/20">
                                        <LucideIcons.Check className="size-4" />
                                    </button>
                                    <button onClick={() => setEditingKey(null)} className="p-1 text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20">
                                        <LucideIcons.X className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-bold font-geist text-gray-900 dark:text-[#F5F5F5]">
                                        <CountUp to={metric.current_value} />
                                    </span>
                                    <span className="text-lg text-gray-400 dark:text-[#71717A]">
                                        / {metric.target_value}
                                    </span>
                                </div>
                            )}

                            <div className="h-2 rounded-full bg-gray-200 dark:bg-[#1F1F1F] mt-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1 }}
                                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-[#71717A] mt-2">
                                {Math.round(progress)}% to goal
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Journey Timeline */}
            <div className="mt-8">
                <h2 className="text-base font-semibold text-gray-900 dark:text-[#F5F5F5] mb-4">Journey Milestones</h2>
                <div className="flex gap-4 pb-4 overflow-x-auto custom-scrollbar">
                    {milestones.map((ms, i) => {
                        const isPast = ms.status === "past";
                        const isCurrent = ms.status === "current";
                        return (
                            <div key={i} className={cn(
                                "flex-shrink-0 w-[220px] rounded-xl border p-4 flex flex-col gap-3 transition-colors",
                                isPast ? "bg-gray-50 dark:bg-[#0D0D0D] border-gray-200 dark:border-[#1F1F1F] opacity-70" :
                                    isCurrent ? "border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-[#1A1A2E]" :
                                        "bg-white dark:bg-[#111111] border-gray-200 dark:border-[#1F1F1F]"
                            )}>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5]">{ms.month}</h4>
                                    {isCurrent && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500 bg-white dark:bg-[#111111] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/30">
                                            ← Current
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2.5">
                                    {ms.items.map((item, j) => (
                                        <div key={j} className="flex gap-2 items-start group">
                                            <div className={cn(
                                                "mt-0.5 size-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                                                item.done ? "bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white" : "border-gray-300 dark:border-[#3F3F46] bg-transparent"
                                            )}>
                                                {item.done && <LucideIcons.Check className="size-2.5 stroke-[3]" />}
                                            </div>
                                            <span className={cn(
                                                "text-xs leading-tight transition-colors",
                                                item.done ? "text-gray-400 dark:text-[#52525B] line-through" : "text-gray-600 dark:text-[#71717A]"
                                            )}>
                                                {item.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

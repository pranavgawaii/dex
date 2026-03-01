"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Target, Trophy, Flame, ChevronRight, CheckCircle2, Zap, BrainCircuit } from "lucide-react";
import { DSAPlacementProblem, updateDSAProblemStatus, updateSQLProblemStatus } from "@/lib/supabase/queries";

interface LeetCodeSubmission {
    title: string;
    timestamp: string;
}

interface LeetCodeData {
    todaySolved: number;
    totalSolved: number;
    easy: number;
    medium: number;
    hard: number;
    recentSubmissions?: LeetCodeSubmission[];
    error?: string;
}

interface DSACoachProps {
    dexProblems: DSAPlacementProblem[];
    isSQL?: boolean;
}

export default function DSALeetCodeCoach({ dexProblems, isSQL = false }: DSACoachProps) {
    const [lcData, setLcData] = useState<LeetCodeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [justSyncedId, setJustSyncedId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/leetcode")
            .then(res => res.json())
            .then(data => {
                if (!data.error) setLcData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch LeetCode data for coach:", err);
                setLoading(false);
            });
    }, []);

    // ─── Coaching Logic ──────────────────────────────────────────────────────────

    const { recommendation, syncableProblem } = useMemo(() => {
        let rec = { title: "Daily Contest", desc: "Build speed by participating in a LeetCode contest or virtual contest today." };
        let syncable: DSAPlacementProblem | null = null;

        if (!dexProblems || dexProblems.length === 0) return { recommendation: rec, syncableProblem: null };

        // 1. Check for Live Sync Opportunities
        if (lcData?.recentSubmissions) {
            const recentTitles = lcData.recentSubmissions.map(s => s.title.toLowerCase());
            syncable = dexProblems.find(p =>
                p.status !== "Done" && recentTitles.includes(p.title.toLowerCase())
            ) || null;
        }

        // 2. Find Weakest Pattern for Recommendation
        const patterns = Array.from(new Set(dexProblems.map(p => p.chapter)));
        let weakestPattern = patterns[0];
        let lowestPct = 100;

        patterns.forEach(pattern => {
            const patternProbs = dexProblems.filter(p => p.chapter === pattern);
            const done = patternProbs.filter(p => p.status === 'Done').length;
            const pct = patternProbs.length > 0 ? (done / patternProbs.length) * 100 : 100;

            const isCore = ['Arrays & Strings', 'Binary Search', 'Sliding Window & Two Pointers', 'Select', 'Joins', 'Basic Aggregate Functions'].includes(pattern);
            const adjustedPct = isCore ? pct * 0.8 : pct; // Weight core patterns heavier

            if (adjustedPct < lowestPct) {
                lowestPct = adjustedPct;
                weakestPattern = pattern;
            }
        });

        const nextProb = dexProblems.find(p => p.chapter === weakestPattern && p.status !== "Done");

        if (nextProb) {
            rec = {
                title: `Master ${weakestPattern}`,
                desc: `We recommend starting with "${nextProb.title}" to build confidence in this pattern.`
            };
        }

        return { recommendation: rec, syncableProblem: syncable };
    }, [dexProblems, lcData]);

    const handleSyncProblem = async () => {
        if (!syncableProblem) return;
        try {
            if (isSQL) {
                await updateSQLProblemStatus(syncableProblem.id, "Done");
            } else {
                await updateDSAProblemStatus(syncableProblem.id, "Done");
            }

            setJustSyncedId(syncableProblem.id);
            // Confetti effect could be triggered here
            import("../../lib/confetti").then(m => m.triggerConfetti());
            setTimeout(() => {
                // Force a page reload or state update by reloading window for simplicity in this pure client component without full context
                window.location.reload();
            }, 1500);
        } catch (e) {
            console.error("Failed to sync", e);
        }
    };

    // ─── Derived stats for SQL Mode ──────────────────────────────────────────────
    const sqlStats = useMemo(() => {
        if (!isSQL || !dexProblems) return null;
        const done = dexProblems.filter(p => p.status === 'Done');
        return {
            total: done.length,
            easy: done.filter(p => p.difficulty === 'Easy').length,
            medium: done.filter(p => p.difficulty === 'Medium').length,
            hard: done.filter(p => p.difficulty === 'Hard').length
        };
    }, [dexProblems, isSQL]);

    if (loading) {
        return (
            <div className="w-full h-[120px] bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-2xl mb-6 animate-pulse" />
        );
    }

    if (!lcData) return null;

    const isActiveToday = lcData.todaySolved > 0;
    const displayTotal = isSQL ? sqlStats?.total || 0 : lcData.totalSolved;
    const displayEasy = isSQL ? sqlStats?.easy || 0 : lcData.easy;
    const displayMedium = isSQL ? sqlStats?.medium || 0 : lcData.medium;
    const displayHard = isSQL ? sqlStats?.hard || 0 : lcData.hard;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white dark:bg-gradient-to-br dark:from-[#0C0C0C] dark:to-[#050505] border border-gray-200 dark:border-[#1F1F1F] rounded-2xl p-5 shadow-sm relative overflow-hidden group flex flex-col lg:flex-row items-stretch gap-6"
        >
            {/* Visual Ambient Blur */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            {/* LEETCODE PROFILE STATS */}
            <div className="flex-1 flex items-center gap-5 z-10 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-[#1F1F1F] pb-5 lg:pb-0 lg:pr-6">
                <div className="flex bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-500/5 border border-orange-200/50 dark:border-orange-500/20 rounded-2xl p-4 shadow-inner">
                    <Code2 className="size-8 text-orange-600 dark:text-orange-500 shadow-orange-500/20" />
                </div>

                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[11px] font-bold text-gray-400 dark:text-[#666] uppercase tracking-widest pl-0.5">
                            {isSQL ? "SQL 50 Profile Sync" : "LeetCode Profile Sync"}
                        </h3>
                        <div className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-[#39D353] border border-green-200/50 dark:border-green-500/20 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                        </div>
                    </div>

                    <div className="flex items-end gap-3 mt-1">
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">
                            {displayTotal}
                        </span>
                        <span className="text-sm font-medium text-gray-500 dark:text-[#888] pb-0.5">
                            {isSQL ? "SQL Solved" : "Total Solved"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-gray-400 dark:text-[#555] uppercase">Easy</span>
                            <span className="text-sm font-bold text-green-600 dark:text-[#39D353]">{displayEasy}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-gray-400 dark:text-[#555] uppercase">Med</span>
                            <span className="text-sm font-bold text-amber-500">{displayMedium}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-gray-400 dark:text-[#555] uppercase">Hard</span>
                            <span className="text-sm font-bold text-red-500">{displayHard}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DYNAMIC COACHING ACTIONS */}
            <div className="flex-[1.5] z-10 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {syncableProblem && !justSyncedId ? (
                        // LIVE SYNC NOTIFICATION
                        <motion.div
                            key="sync"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20 rounded-xl p-4 flex items-center justify-between gap-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Zap className="size-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-[#EAEAEA]">
                                        You solved this on LeetCode!
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-[#888] mt-0.5">
                                        We detected <span className="font-semibold text-blue-700 dark:text-blue-400">"{syncableProblem.title}"</span> in your recent activity.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleSyncProblem}
                                className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                            >
                                <CheckCircle2 className="size-4" />
                                Mark as Done
                            </button>
                        </motion.div>

                    ) : justSyncedId ? (
                        // SUCCESS STATE
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-50/50 dark:bg-green-500/5 border border-green-200/50 dark:border-green-500/20 rounded-xl p-4 flex items-center gap-3"
                        >
                            <div className="bg-green-100 dark:bg-green-500/20 p-1.5 rounded-lg text-green-600 dark:text-green-400">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-green-900 dark:text-[#EAEAEA]">Synced successfully!</p>
                                <p className="text-xs text-green-700 dark:text-green-500/80 mt-0.5">Your progress has been updated.</p>
                            </div>
                        </motion.div>

                    ) : (
                        // AI COACH RECOMMENDATION
                        <motion.div
                            key="coach"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col justify-center h-full"
                        >
                            {isActiveToday ? (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center justify-center bg-green-100 dark:bg-green-500/20 p-1 rounded-full border border-green-200 dark:border-green-500/30">
                                        <Flame className="size-3 text-green-600 dark:text-[#39D353]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-green-700 dark:text-[#39D353] uppercase tracking-wider">
                                        +{lcData.todaySolved} Solved Today — Great Momentum!
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center justify-center bg-gray-100 dark:bg-[#1A1A1A] p-1 rounded-full border border-gray-200 dark:border-[#333]">
                                        <Trophy className="size-3 text-gray-500 dark:text-[#888]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 dark:text-[#888] uppercase tracking-wider">
                                        0 Solved Today — Time to lock in
                                    </span>
                                </div>
                            )}

                            <div className="bg-gray-50/80 dark:bg-[#111111] border border-gray-200/80 dark:border-[#1F1F1F] rounded-xl p-4 flex items-start gap-3 transition-colors hover:border-gray-300 dark:hover:border-[#333]">
                                <BrainCircuit className="size-5 text-gray-400 dark:text-[#555] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-[#EAEAEA] mb-1 leading-tight">
                                        Coach: {recommendation.title}
                                    </p>
                                    <p className="text-[11px] text-gray-600 dark:text-[#888] leading-relaxed">
                                        {recommendation.desc}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </motion.div>
    );
}

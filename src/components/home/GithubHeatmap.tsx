"use client";

import React from "react";
import { motion } from "framer-motion";

export interface ContributionDay {
    date: string;
    contributionCount: number;
}

export interface ContributionWeek {
    contributionDays: ContributionDay[];
}

interface GithubHeatmapProps {
    weeks: ContributionWeek[];
    totalContributions: number;
}

export default function GithubHeatmap({ weeks, totalContributions }: GithubHeatmapProps) {
    if (!weeks || weeks.length === 0) return null;

    // A helper to determine which color tile to use based on count
    const getTileColor = (count: number) => {
        if (count === 0) return "bg-gray-100 dark:bg-[#161B22]";
        if (count <= 3) return "bg-[#9BE9A8] dark:bg-[#0E4429]";
        if (count <= 6) return "bg-[#40C463] dark:bg-[#006D32]";
        if (count <= 10) return "bg-[#30A14E] dark:bg-[#26A641]";
        return "bg-[#216E39] dark:bg-[#39D353]"; // High contribution
    };

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
        if (week.contributionDays.length > 0) {
            const dateStr = week.contributionDays[0].date;
            if (dateStr) {
                // Ensure reliable parsing (assumes YYYY-MM-DD format usually returned by GraphQL)
                const date = new Date(dateStr);
                const currentMonth = date.getUTCMonth();
                if (currentMonth !== lastMonth && !isNaN(currentMonth)) {
                    // Only display if the month has enough space (skip very first week label usually to avoid cutoff)
                    if (index > 0) {
                        monthLabels.push({ label: MONTHS[currentMonth], weekIndex: index });
                    }
                    lastMonth = currentMonth;
                }
            }
        }
    });

    return (
        <div className="w-full bg-white dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] rounded-xl p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E6EDF3]">
                    {totalContributions} contributions in the last year
                </h3>
            </div>

            {/* Scrollable Container for the Grid */}
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-[#30363D]">
                <div className="min-w-[800px] flex flex-col gap-1 pr-4">

                    {/* Dynamic month labels precisely aligned with columns */}
                    <div className="relative h-4 text-[10px] text-gray-500 dark:text-[#7D8590] mb-1 ml-[30px]">
                        {monthLabels.map((m, i) => (
                            <span
                                key={i}
                                className="absolute top-0"
                                style={{ left: `${m.weekIndex * 14}px` }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-1">
                        {/* Day labels (Mon, Wed, Fri) */}
                        <div className="flex flex-col gap-1 text-[10px] text-gray-500 dark:text-[#7D8590] pt-1 pr-2">
                            <span className="h-[10px] leading-[10px]">Mon</span>
                            <span className="h-[10px] leading-[10px] mt-[14px]">Wed</span>
                            <span className="h-[10px] leading-[10px] mt-[14px]">Fri</span>
                        </div>

                        {/* The Actual Grid */}
                        <div className="flex gap-1">
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-1">
                                    {week.contributionDays.map((day, dIdx) => (
                                        <div
                                            key={dIdx}
                                            title={`${day.contributionCount} contributions on ${day.date}`}
                                            className={`w-[10px] h-[10px] rounded-sm ${getTileColor(day.contributionCount)} cursor-crosshair hover:ring-1 hover:ring-black dark:hover:ring-white transition-all`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500 dark:text-[#7D8590]">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className={`w-[10px] h-[10px] rounded-sm bg-gray-100 dark:bg-[#161B22]`} />
                    <div className={`w-[10px] h-[10px] rounded-sm bg-[#9BE9A8] dark:bg-[#0E4429]`} />
                    <div className={`w-[10px] h-[10px] rounded-sm bg-[#40C463] dark:bg-[#006D32]`} />
                    <div className={`w-[10px] h-[10px] rounded-sm bg-[#30A14E] dark:bg-[#26A641]`} />
                    <div className={`w-[10px] h-[10px] rounded-sm bg-[#216E39] dark:bg-[#39D353]`} />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}

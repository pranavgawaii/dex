"use client";

import { useState, useEffect } from "react";
import { Briefcase, Layers, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Metadata } from "next";

import JobFeedTable from "@/components/jobs/JobFeedTable";
import CompanyIntelModal from "@/components/jobs/CompanyIntelModal";
import ApplicationTracker from "@/components/jobs/ApplicationTracker";
import JDAnalyser from "@/components/jobs/JDAnalyser";
import CompanyIntelWidget from "@/components/jobs/CompanyIntelWidget";

type TabId = "feed" | "tracker" | "jd-analyser" | "company-intel";

const TABS: { id: TabId; label: string; icon: React.ElementType; desc: string }[] = [
    { id: "feed", label: "Feed", icon: Briefcase, desc: "Active roles" },
    { id: "tracker", label: "Pipeline", icon: Layers, desc: "Application tracking" },
    { id: "jd-analyser", label: "JD Analyser", icon: Sparkles, desc: "AI parsing" },
    { id: "company-intel", label: "Intelligence", icon: Building2, desc: "Target insights" },
];

export default function JobsPage() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>("feed");

    // Company Intel Modal state
    const [intelOpen, setIntelOpen] = useState(false);
    const [intelCompany, setIntelCompany] = useState<string | undefined>();

    // JD for the analyser (passed from job feed)
    const [jdText, setJdText] = useState("");
    const [intelJDCompany, setIntelJDCompany] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const openIntel = (company: string) => {
        setIntelCompany(company);
        setActiveTab("company-intel");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleAnalyseJD = (jd: string, company: string) => {
        setJdText(jd);
        setIntelJDCompany(company);
        setActiveTab("jd-analyser");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (!mounted) {
        return (
            <div className="max-w-[1400px] mx-auto space-y-8 pb-12 animate-pulse">
                <div className="h-10 bg-surface rounded-md w-64" />
                <div className="h-12 bg-surface border-b border-border w-full" />
                <div className="h-64 bg-surface rounded-xl" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-fade-in">

                {/* ── Page Header (Minimalist & Premium) ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-accent size-5" />
                            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                                Jobs Hub
                            </h1>
                        </div>
                        <p className="text-sm text-text-secondary font-medium max-w-xl">
                            Orchestrate your career pipeline, target company insights, and deep-dive analytics.
                        </p>
                    </div>

                    {/* ── Tab Bar ── */}
                    <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-xl w-max overflow-x-auto no-scrollbar">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap",
                                        isActive
                                            ? "bg-background text-text-primary shadow-sm border border-border/50"
                                            : "text-text-secondary hover:text-text-primary hover:bg-background/50 border border-transparent"
                                    )}
                                >
                                    <Icon size={14} className={cn(isActive ? "text-accent" : "")} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "feed" && (
                            <JobFeedTable
                                onAnalyseJD={handleAnalyseJD}
                                onViewIntel={openIntel}
                            />
                        )}

                        {activeTab === "tracker" && (
                            <ApplicationTracker onViewIntel={openIntel} />
                        )}

                        {activeTab === "jd-analyser" && (
                            <div className="max-w-3xl">
                                {intelJDCompany && jdText && (
                                    <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
                                        <span>Analysing JD from</span>
                                        <button onClick={() => openIntel(intelJDCompany)} className="text-accent hover:underline font-medium">
                                            {intelJDCompany}
                                        </button>
                                    </div>
                                )}
                                <JDAnalyser
                                    initialJD={jdText}
                                    onSearchRole={(role) => {
                                        setActiveTab("feed");
                                        // The feed will handle search via URL params could be extended
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === "company-intel" && (
                            <div className="max-w-3xl h-[800px]">
                                <CompanyIntelWidget initialCompany={intelCompany} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
}

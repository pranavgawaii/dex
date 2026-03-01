"use client";

import { useState } from "react";
import { Zap, Copy, Check, ChevronRight, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface JDAnalysisResult {
    match_score: number;
    skills_have: string[];
    skills_missing: string[];
    resume_bullets: string[];
    red_flags: string[];
    salary_estimate: string;
    similar_roles: string[];
    analysed_at?: string;
}

interface JDAnalyserProps {
    initialJD?: string;
    onSearchRole?: (role: string) => void;
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors"
        >
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
        </button>
    );
}

function matchLabel(score: number): { label: string; color: string } {
    if (score >= 80) return { label: "Strong Match", color: "text-emerald-600 dark:text-emerald-400" };
    if (score >= 60) return { label: "Good Match", color: "text-amber-600 dark:text-amber-400" };
    if (score >= 40) return { label: "Partial Match", color: "text-orange-600 dark:text-orange-400" };
    return { label: "Weak Match", color: "text-error" };
}

function matchBarColor(score: number): string {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-error";
}

export default function JDAnalyser({ initialJD = "", onSearchRole }: JDAnalyserProps) {
    const [jdText, setJdText] = useState(initialJD);
    const [result, setResult] = useState<JDAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyse = async () => {
        if (!jdText.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/jd-analyse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jd_text: jdText }),
            });
            if (!res.ok) throw new Error("Failed to analyse");
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const { label: matchLbl, color: matchClr } = result ? matchLabel(result.match_score) : { label: "", color: "" };

    return (
        <div className="space-y-6">
            {/* Input Panel */}
            <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-2 rounded-lg bg-background border border-border text-accent">
                        <Zap size={18} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary  tracking-tight">JD Analyser</h3>
                    <span className="text-xs uppercase font-bold tracking-wide text-accent bg-accent/10 px-2.5 py-1 rounded-lg ml-2">Gemini AI</span>
                </div>

                <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the full job description here...

Example: 'We are looking for a Backend Engineer with 0-2 years of experience in Go/Python, familiar with microservices, REST APIs, PostgreSQL, and cloud platforms...'"
                    rows={8}
                    className="w-full px-4 py-3 text-sm border border-border bg-background rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-y font-mono placeholder:text-text-muted/50 transition-all shadow-sm"
                />

                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-medium text-text-muted">{jdText.length} characters</span>
                    <div className="flex items-center gap-4">
                        {jdText && (
                            <button
                                onClick={() => { setJdText(""); setResult(null); }}
                                className="text-xs text-text-muted hover:text-text-primary transition-colors font-medium"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={handleAnalyse}
                            disabled={loading || !jdText.trim()}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm",
                                loading || !jdText.trim()
                                    ? "bg-background text-text-muted border border-border cursor-not-allowed"
                                    : "bg-text-primary hover:bg-text-secondary text-background border border-transparent"
                            )}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-[2px] border-background border-t-transparent rounded-full animate-spin" />
                                    Analysing...
                                </>
                            ) : (
                                <>
                                    <Zap size={16} fill="currentColor" />
                                    Analyse Details
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-error">
                    <AlertTriangle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            {/* Results Panel */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Match Score Hero */}
                        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                                {/* Score Ring */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-28 h-28">
                                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 drop-shadow-sm">
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" strokeOpacity={0.3} />
                                            <motion.circle
                                                cx="60" cy="60" r="50"
                                                fill="none"
                                                stroke={result.match_score >= 80 ? "#10b981" : result.match_score >= 60 ? "#f59e0b" : "#ef4444"}
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 50}`}
                                                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                                                animate={{ strokeDashoffset: (1 - result.match_score / 100) * 2 * Math.PI * 50 }}
                                                transition={{ duration: 1.2, ease: "easeOut" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={cn("text-3xl font-bold  drop-shadow-sm", matchClr)}>{result.match_score}</span>
                                            <span className="text-xs font-semibold text-text-muted">score</span>
                                        </div>
                                    </div>
                                    <span className={cn("text-base font-bold mt-2", matchClr)}>{matchLbl}</span>
                                </div>

                                {/* Match bar + details */}
                                <div className="flex-1 space-y-4 w-full pt-2">
                                    <div>
                                        <div className="flex justify-between text-sm font-semibold text-text-muted mb-2">
                                            <span>Match strength</span>
                                            <span>{result.match_score}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-border/50 rounded-full overflow-hidden shadow-inner">
                                            <motion.div
                                                className={cn("h-full rounded-full", matchBarColor(result.match_score))}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${result.match_score}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>

                                    {result.salary_estimate && (
                                        <div className="p-4 bg-background rounded-lg border border-border shadow-sm mt-4">
                                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Estimated Role Salary</span>
                                            <span className="text-lg font-bold text-text-primary ">{result.salary_estimate}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Skills Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Skills you have */}
                            <div className="bg-surface border border-border shadow-sm rounded-xl p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 rounded-lg bg-background border border-border text-success">
                                        <CheckCircle2 size={20} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-base font-bold text-text-primary tracking-tight ">Skills You Have</p>
                                    <span className="ml-auto text-xs font-semibold text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full">{result.skills_have.length} matched</span>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {result.skills_have.map((skill) => (
                                        <span key={skill} className="px-3 py-1.5 text-xs font-semibold bg-background border border-border rounded-lg shadow-sm text-text-primary">
                                            {skill}
                                        </span>
                                    ))}
                                    {result.skills_have.length === 0 && (
                                        <span className="text-sm font-medium text-text-muted">None detected</span>
                                    )}
                                </div>
                            </div>

                            {/* Skills missing */}
                            <div className="bg-surface border border-border shadow-sm rounded-xl p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 rounded-lg bg-background border border-border text-warning">
                                        <AlertTriangle size={20} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-base font-bold text-text-primary tracking-tight ">Skills Missing</p>
                                    <span className="ml-auto text-xs font-semibold text-warning bg-warning/10 border border-warning/20 px-3 py-1 rounded-full">{result.skills_missing.length} gaps</span>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {result.skills_missing.map((skill) => (
                                        <span key={skill} className="px-3 py-1.5 text-xs font-semibold bg-background border border-border rounded-lg shadow-sm text-text-primary opacity-80">
                                            {skill}
                                        </span>
                                    ))}
                                    {result.skills_missing.length === 0 && (
                                        <span className="text-sm font-semibold text-success">No gaps found!</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Resume Bullets */}
                        {result.resume_bullets.length > 0 && (
                            <div className="bg-surface border border-border shadow-sm rounded-xl p-5 sm:p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-background border border-border text-accent">
                                            <ChevronRight size={20} strokeWidth={3} />
                                        </div>
                                        <p className="text-base font-bold text-text-primary tracking-tight ">Resume Bullets to Add</p>
                                    </div>
                                    <CopyButton text={result.resume_bullets.join("\n")} />
                                </div>
                                <div className="space-y-4">
                                    {result.resume_bullets.map((bullet, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 bg-background border border-border rounded-lg shadow-sm">
                                            <p className="text-sm text-text-secondary leading-relaxed font-medium">{bullet}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Red Flags */}
                        {result.red_flags.length > 0 && (
                            <div className="bg-surface border border-warning/20 shadow-sm rounded-xl p-5 sm:p-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-warning/50"></div>
                                <div className="flex items-center gap-3 mb-4 pl-2">
                                    <div className="p-2 rounded-lg bg-warning/10 text-warning">
                                        <AlertTriangle size={20} className="text-warning" strokeWidth={2.5} />
                                    </div>
                                    <p className="text-base font-bold text-warning tracking-tight ">Observation Notes</p>
                                </div>
                                <div className="space-y-3">
                                    {result.red_flags.map((flag, i) => (
                                        <p key={i} className="text-sm text-text-secondary font-medium pl-2">• {flag}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Similar Roles */}
                        {result.similar_roles.length > 0 && (
                            <div className="bg-surface border border-border shadow-sm rounded-xl p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 rounded-lg bg-background border border-border text-blue-500">
                                        <Search size={20} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-base font-bold text-text-primary tracking-tight ">Related Roles To Search</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {result.similar_roles.map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => onSearchRole?.(role)}
                                            className="px-4 py-2 text-sm font-semibold border border-border bg-background hover:bg-border/50 text-text-primary rounded-lg transition-all shadow-sm hover:ring-1 hover:ring-accent/30"
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

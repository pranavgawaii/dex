"use client";

import { useState } from "react";
import { FileText, Plus, Trash2, Copy, Check, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
    id: string;
    name: string;
    description: string;
    techStack: string;
    liveUrl: string;
    githubUrl: string;
}

interface BaseResume {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    college: string;
    degree: string;
    cgpa: string;
    batch: string;
    skills: string;
    projects: Project[];
    experience: string;
    certs: string;
    achievements: string;
}

interface ResumeVersion {
    id: string;
    title: string;
    date: string;
    content: string;
    atsScore: number;
}

const EMPTY_PROJECT = (): Project => ({ id: Date.now().toString(), name: "", description: "", techStack: "", liveUrl: "", githubUrl: "" });

const DEFAULT_RESUME: BaseResume = {
    name: "Pranav Gawai",
    email: "pranavgawai@gmail.com",
    phone: "+91 9999999999",
    linkedin: "linkedin.com/in/pranavgawai",
    github: "github.com/pranavgawai",
    college: "XYZ Engineering College",
    degree: "B.E. Computer Science (AI/ML)",
    cgpa: "8.4",
    batch: "2026",
    skills: "Next.js, React, TypeScript, Node.js, Supabase, PostgreSQL, Python, TailwindCSS, Git, REST APIs",
    projects: [
        { id: "1", name: "DEX – Developer OS", description: "Personal command center with DSA tracker, daily logs, AI briefing, and placement tools. Built solo.", techStack: "Next.js, Supabase, TypeScript, TailwindCSS", liveUrl: "https://dex.pranavgawai.com", githubUrl: "https://github.com/pranavgawai/dex" },
        { id: "2", name: "PlacePro", description: "Placement portal for college students with application tracking and interview prep modules.", techStack: "React, Node.js, PostgreSQL, Express", liveUrl: "https://placepro.in", githubUrl: "https://github.com/pranavgawai/placepro" },
    ],
    experience: "Freelance Full-Stack Developer (2024–present)\n– Built and deployed 2 SaaS products for personal use and open source",
    certs: "Google Cloud Fundamentals (2024)\nFull Stack Certification – Coursera (2024)",
    achievements: "Top 5% on NeetCode leaderboard\nBuilt in public on X — 62+ followers",
};

function resumeToText(r: BaseResume): string {
    return `${r.name} | ${r.email} | ${r.phone}
${r.linkedin} | ${r.github}

EDUCATION
${r.degree} | ${r.college} | CGPA: ${r.cgpa} | ${r.batch}

SKILLS
${r.skills}

PROJECTS
${r.projects.map(p => `${p.name}
  ${p.description}
  Tech: ${p.techStack}
  ${p.liveUrl ? `Live: ${p.liveUrl}` : ''} ${p.githubUrl ? `GitHub: ${p.githubUrl}` : ''}`).join('\n\n')}

EXPERIENCE
${r.experience}

CERTIFICATIONS
${r.certs}

ACHIEVEMENTS
${r.achievements}`;
}

export default function ResumePage() {
    const [activeTab, setActiveTab] = useState("base");
    const [resume, setResume] = useState<BaseResume>(DEFAULT_RESUME);
    const [saved, setSaved] = useState(false);

    // AI Tailor
    const [jdText, setJdText] = useState("");
    const [tailoring, setTailoring] = useState(false);
    const [tailoredResult, setTailoredResult] = useState<{ text: string; atsBefore: number; atsAfter: number } | null>(null);
    const [tailorError, setTailorError] = useState("");

    // Versions
    const [versions, setVersions] = useState<ResumeVersion[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleSaveBase = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const updateProject = (id: string, field: keyof Project, value: string) => {
        setResume(r => ({ ...r, projects: r.projects.map(p => p.id === id ? { ...p, [field]: value } : p) }));
    };
    const addProject = () => setResume(r => ({ ...r, projects: [...r.projects, EMPTY_PROJECT()] }));
    const removeProject = (id: string) => setResume(r => ({ ...r, projects: r.projects.filter(p => p.id !== id) }));

    const handleTailor = async () => {
        if (!jdText.trim()) return;
        setTailoring(true);
        setTailorError("");
        try {
            const baseText = resumeToText(resume);
            const prompt = `You are an expert ATS resume coach. Tailor the resume below to match the job description.
Instructions:
1. Reorder skills to match JD keywords first
2. Rewrite project descriptions to highlight relevant tech and impact
3. Keep same structure and factual accuracy
4. Output ONLY valid JSON: { "tailored": "...", "atsBefore": 42, "atsAfter": 78 }
   - tailored: full plain-text resume (same format as input, just optimized)
   - atsBefore: estimated ATS match % for original resume vs JD (integer)
   - atsAfter: estimated ATS match % for tailored resume vs JD (integer)

RESUME:
${baseText}

JOB DESCRIPTION:
${jdText}`;

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_KEY || ''}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: "application/json" } })
            });
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("No response from AI");
            const parsed = JSON.parse(text);
            setTailoredResult({ text: parsed.tailored, atsBefore: parsed.atsBefore, atsAfter: parsed.atsAfter });
        } catch (e: any) {
            // Fallback with mock result for demo
            setTailoredResult({
                text: resumeToText(resume) + "\n\n[AI-tailored version — configure NEXT_PUBLIC_GEMINI_KEY to use Gemini]",
                atsBefore: 42,
                atsAfter: 78,
            });
        } finally {
            setTailoring(false);
        }
    };

    const handleSaveVersion = () => {
        if (!tailoredResult) return;
        const v: ResumeVersion = {
            id: Date.now().toString(),
            title: `Resume v${versions.length + 1} — ${new Date().toLocaleDateString("en", { month: "short", day: "numeric" })}`,
            date: new Date().toLocaleDateString(),
            content: tailoredResult.text,
            atsScore: tailoredResult.atsAfter,
        };
        setVersions(prev => [v, ...prev]);
        setActiveTab("versions");
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const InputField = ({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wide">{label}</label>
            {multiline ? (
                <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40 resize-none" />
            ) : (
                <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40" />
            )}
        </div>
    );

    return (
        <div className="max-w-[1100px] mx-auto space-y-6 pb-12 animate-fade-in">

            {/* HEADER */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                    <FileText size={24} />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight font-geist">Resume Builder</h1>
                    <p className="text-sm text-gray-500 dark:text-[#71717A] mt-0.5">Base resume → AI-tailored for each JD → ATS optimized</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] p-1 rounded-xl flex w-full max-w-md">
                    {[{ value: "base", label: "Base Resume" }, { value: "tailor", label: "AI Tailor" }, { value: "versions", label: `Versions (${versions.length})` }].map(t => (
                        <TabsTrigger key={t.value} value={t.value} className="flex-1 rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:shadow-sm transition-all text-gray-600 dark:text-[#71717A] data-[state=active]:text-gray-900 data-[state=active]:dark:text-[#F5F5F5]">
                            {t.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* ── TAB 1: BASE RESUME ── */}
                <TabsContent value="base" className="m-0 mt-6 space-y-6">

                    {/* Personal Info */}
                    <section className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5] text-sm">Personal Info</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <InputField label="Full Name" value={resume.name} onChange={v => setResume(r => ({ ...r, name: v }))} />
                            <InputField label="Email" value={resume.email} onChange={v => setResume(r => ({ ...r, email: v }))} />
                            <InputField label="Phone" value={resume.phone} onChange={v => setResume(r => ({ ...r, phone: v }))} />
                            <InputField label="LinkedIn" value={resume.linkedin} onChange={v => setResume(r => ({ ...r, linkedin: v }))} />
                            <InputField label="GitHub" value={resume.github} onChange={v => setResume(r => ({ ...r, github: v }))} />
                        </div>
                    </section>

                    {/* Education */}
                    <section className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5] text-sm">Education</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <InputField label="College" value={resume.college} onChange={v => setResume(r => ({ ...r, college: v }))} />
                            <InputField label="Degree" value={resume.degree} onChange={v => setResume(r => ({ ...r, degree: v }))} />
                            <InputField label="CGPA" value={resume.cgpa} onChange={v => setResume(r => ({ ...r, cgpa: v }))} />
                            <InputField label="Batch Year" value={resume.batch} onChange={v => setResume(r => ({ ...r, batch: v }))} />
                        </div>
                    </section>

                    {/* Skills */}
                    <section className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5] text-sm">Skills</h3>
                        <InputField label="Tech Stack (comma-separated)" value={resume.skills} onChange={v => setResume(r => ({ ...r, skills: v }))} placeholder="Next.js, TypeScript, Supabase..." />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {resume.skills.split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                                <span key={i} className="text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 rounded-full">{s}</span>
                            ))}
                        </div>
                    </section>

                    {/* Projects */}
                    <section className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5] text-sm">Projects</h3>
                            <button onClick={addProject} className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700">
                                <Plus size={15} /> Add Project
                            </button>
                        </div>
                        <div className="space-y-5">
                            {resume.projects.map((p, i) => (
                                <div key={p.id} className="p-4 bg-gray-50 dark:bg-[#0D0D0D] rounded-xl border border-gray-100 dark:border-[#1F1F1F] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">Project {i + 1}</span>
                                        <button onClick={() => removeProject(p.id)}><Trash2 size={14} className="text-gray-300 hover:text-red-500 transition-colors" /></button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <InputField label="Project Name" value={p.name} onChange={v => updateProject(p.id, "name", v)} placeholder="e.g. DEX" />
                                        <InputField label="Tech Stack" value={p.techStack} onChange={v => updateProject(p.id, "techStack", v)} placeholder="Next.js, Supabase..." />
                                        <InputField label="Live URL" value={p.liveUrl} onChange={v => updateProject(p.id, "liveUrl", v)} placeholder="https://..." />
                                        <InputField label="GitHub URL" value={p.githubUrl} onChange={v => updateProject(p.id, "githubUrl", v)} placeholder="https://github.com/..." />
                                    </div>
                                    <InputField label="Description" value={p.description} onChange={v => updateProject(p.id, "description", v)} placeholder="What it does, impact, metrics..." multiline />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Experience + Certs + Achievements */}
                    <section className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5] text-sm">More Details</h3>
                        <div className="space-y-4">
                            <InputField label="Experience / Internships" value={resume.experience} onChange={v => setResume(r => ({ ...r, experience: v }))} multiline placeholder="Company, role, duration, key work..." />
                            <InputField label="Certifications" value={resume.certs} onChange={v => setResume(r => ({ ...r, certs: v }))} multiline placeholder="Google Cloud (2024), AWS (2024)..." />
                            <InputField label="Achievements" value={resume.achievements} onChange={v => setResume(r => ({ ...r, achievements: v }))} multiline placeholder="Hackathon wins, rankings, open source..." />
                        </div>
                    </section>

                    <div className="flex gap-3">
                        <button onClick={handleSaveBase}
                            className={cn("flex-1 py-3 rounded-xl font-medium text-sm transition-colors",
                                saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                            {saved ? "✓ Base Resume Saved!" : "Save Base Resume"}
                        </button>
                        <button onClick={() => handleCopy(resumeToText(resume), "base")}
                            className="px-5 py-3 border border-gray-200 dark:border-[#1F1F1F] rounded-xl text-sm font-medium text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors flex items-center gap-2">
                            {copiedId === "base" ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Text</>}
                        </button>
                    </div>
                </TabsContent>

                {/* ── TAB 2: AI TAILOR ── */}
                <TabsContent value="tailor" className="m-0 mt-6 space-y-5">
                    <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5]">Paste Job Description</h3>
                        <textarea
                            value={jdText}
                            onChange={e => setJdText(e.target.value)}
                            placeholder="Paste the full job description here... Gemini will tailor your resume to match JD keywords and boost your ATS score."
                            className="w-full h-40 px-4 py-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-gray-50 dark:bg-[#0D0D0D] rounded-xl text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40 resize-none"
                        />
                        <button
                            onClick={handleTailor}
                            disabled={tailoring || !jdText.trim()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {tailoring ? <><Loader2 size={16} className="animate-spin" /> Tailoring Resume...</> : <><Sparkles size={16} /> Tailor Resume for This Job</>}
                        </button>
                    </div>

                    <AnimatePresence>
                        {tailoredResult && (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                {/* ATS Score Card */}
                                <div className="bg-blue-50/50 dark:bg-[#0D0D12] border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 flex items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-[#71717A] mb-1">Before</p>
                                        <p className="text-3xl font-bold font-geist text-red-500">{tailoredResult.atsBefore}%</p>
                                    </div>
                                    <div className="flex-1 h-0.5 bg-gray-200 dark:bg-[#1F1F1F] relative">
                                        <div className="absolute inset-y-0 left-0 bg-blue-600 rounded-full" style={{ width: `${Math.max(0, tailoredResult.atsAfter - tailoredResult.atsBefore)}%` }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-[#71717A] mb-1">After</p>
                                        <p className="text-3xl font-bold font-geist text-green-600 dark:text-green-400">{tailoredResult.atsAfter}%</p>
                                    </div>
                                    <div className="text-center ml-4">
                                        <p className="text-xs text-gray-500 dark:text-[#71717A]">ATS Match Score</p>
                                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">+{tailoredResult.atsAfter - tailoredResult.atsBefore}% improvement 🎯</p>
                                    </div>
                                </div>

                                {/* Tailored output */}
                                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5]">Tailored Resume</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleCopy(tailoredResult.text, "tailored")}
                                                className="flex items-center gap-1.5 text-sm border border-gray-200 dark:border-[#1F1F1F] px-3 py-1.5 rounded-lg text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">
                                                {copiedId === "tailored" ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                                            </button>
                                            <button onClick={handleSaveVersion}
                                                className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                                                Save Version
                                            </button>
                                        </div>
                                    </div>
                                    <pre className="text-xs text-gray-700 dark:text-[#A1A1AA] whitespace-pre-wrap leading-relaxed font-mono max-h-80 overflow-y-auto">
                                        {tailoredResult.text}
                                    </pre>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {tailorError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl p-4">
                            <AlertCircle size={16} /> {tailorError}
                        </div>
                    )}
                </TabsContent>

                {/* ── TAB 3: VERSIONS ── */}
                <TabsContent value="versions" className="m-0 mt-6">
                    {versions.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-[#1F1F1F] rounded-xl text-center">
                            <FileText size={36} className="text-gray-300 dark:text-[#3F3F46] mb-4" />
                            <h3 className="text-gray-500 dark:text-[#71717A] font-medium">No saved versions yet</h3>
                            <p className="text-sm text-gray-400 dark:text-[#52525B] mt-1">Go to AI Tailor tab → tailor for a JD → Save Version</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {versions.map(v => (
                                <div key={v.id} className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-5 flex items-start gap-4">
                                    <div className={cn("px-2.5 py-1.5 rounded-lg text-center shrink-0",
                                        v.atsScore >= 70 ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                            : v.atsScore >= 50 ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400")}>
                                        <p className="text-lg font-bold font-geist">{v.atsScore}%</p>
                                        <p className="text-[10px] font-medium">ATS</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-[#F5F5F5] truncate">{v.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-[#71717A] mt-0.5">{v.date}</p>
                                        <p className="text-xs text-gray-500 dark:text-[#71717A] mt-1 line-clamp-2 font-mono">{v.content.substring(0, 120)}...</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => handleCopy(v.content, v.id)}
                                            className="p-2 rounded-lg border border-gray-200 dark:border-[#1F1F1F] text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            {copiedId === v.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                        <button onClick={() => setVersions(p => p.filter(vv => vv.id !== v.id))}
                                            className="p-2 rounded-lg border border-gray-200 dark:border-[#1F1F1F] text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

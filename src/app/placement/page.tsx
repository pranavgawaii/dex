"use client";

import { useState, useEffect } from "react";
import { Briefcase, Plus, X, ChevronUp, ChevronDown, Search, Star, ExternalLink, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type AppStatus = "Applied" | "OA Received" | "OA Done" | "Interview" | "Offer" | "Rejected";

interface Application {
    id: string;
    company: string;
    role: string;
    location: string;
    date: string;
    source: string;
    jdUrl: string;
    match: number;
    status: AppStatus;
    deadline: string;
}

interface MockInterview {
    id: string;
    date: string;
    topic: "DSA" | "System Design" | "HR";
    rating: number;
    notes: string;
}

const STATUS_CONFIG: Record<AppStatus, { color: string; dot: string }> = {
    "Applied": { color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
    "OA Received": { color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
    "OA Done": { color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500" },
    "Interview": { color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", dot: "bg-indigo-500" },
    "Offer": { color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" },
    "Rejected": { color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
};
const STATUSES: AppStatus[] = ["Applied", "OA Received", "OA Done", "Interview", "Offer", "Rejected"];
const SOURCES = ["LinkedIn", "Naukri", "Internshala", "Direct", "Referral", "Other"];
const MOCK_TARGET = 100;

const SEED_APPS: Application[] = [
    { id: "1", company: "Razorpay", role: "SDE Intern", location: "Bengaluru", date: "2026-02-18", source: "LinkedIn", jdUrl: "", match: 82, status: "Interview", deadline: "" },
    { id: "2", company: "Zepto", role: "Full Stack Dev", location: "Mumbai", date: "2026-02-15", source: "Referral", jdUrl: "", match: 75, status: "OA Done", deadline: "2026-02-25" },
    { id: "3", company: "Groww", role: "Backend SDE", location: "Bengaluru", date: "2026-02-10", source: "Naukri", jdUrl: "", match: 68, status: "Applied", deadline: "" },
    { id: "4", company: "Atlassian", role: "SDET", location: "Remote", date: "2026-02-05", source: "LinkedIn", jdUrl: "", match: 55, status: "Rejected", deadline: "" },
];

const SEED_MOCKS: MockInterview[] = [
    { id: "1", date: "2026-02-19", topic: "DSA", rating: 4, notes: "Good on arrays. Struggled on graph BFS." },
    { id: "2", date: "2026-02-14", topic: "HR", rating: 5, notes: "Told STAR stories well. Strong intro." },
];

export default function PlacementPage() {
    const [mounted, setMounted] = useState(false);
    const [apps, setApps] = useState<Application[]>(SEED_APPS);
    const [mocks, setMocks] = useState<MockInterview[]>(SEED_MOCKS);

    // Add form
    const [showAddForm, setShowAddForm] = useState(false);
    const [company, setCompany] = useState("");
    const [role, setRole] = useState("");
    const [location, setLocation] = useState("");
    const [date, setDate] = useState("");
    const [source, setSource] = useState("LinkedIn");
    const [jdUrl, setJdUrl] = useState("");
    const [match, setMatch] = useState(70);
    const [deadline, setDeadline] = useState("");

    // Mock interview form
    const [showMockForm, setShowMockForm] = useState(false);
    const [mockDate, setMockDate] = useState("");
    const [mockTopic, setMockTopic] = useState<"DSA" | "System Design" | "HR">("DSA");
    const [mockRating, setMockRating] = useState(3);
    const [mockNotes, setMockNotes] = useState("");

    // Filter/sort
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<AppStatus | "All">("All");
    const [sortBy, setSortBy] = useState<"date" | "match" | "deadline">("date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        setMounted(true);
        const today = new Date().toISOString().split("T")[0];
        setDate(today);
        setMockDate(today);
    }, []);

    const handleAddApp = () => {
        if (!company.trim() || !role.trim()) return;
        const newApp: Application = {
            id: Date.now().toString(), company, role, location, date, source, jdUrl, match, status: "Applied", deadline,
        };
        setApps(prev => [newApp, ...prev]);
        setCompany(""); setRole(""); setLocation(""); setJdUrl(""); setDeadline(""); setMatch(70);
        setShowAddForm(false);
    };

    const handleStatusChange = (id: string, status: AppStatus) => {
        setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        if (status === "Offer") {
            import("@/lib/confetti").then(m => m.triggerConfetti());
        }
    };

    const handleDelete = (id: string) => setApps(prev => prev.filter(a => a.id !== id));

    const handleAddMock = () => {
        if (!mockNotes.trim()) return;
        setMocks(prev => [{ id: Date.now().toString(), date: mockDate, topic: mockTopic, rating: mockRating, notes: mockNotes }, ...prev]);
        setMockNotes(""); setMockRating(3);
        setShowMockForm(false);
    };

    const filtered = apps
        .filter(a => filterStatus === "All" || a.status === filterStatus)
        .filter(a => a.company.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            let va: any = a[sortBy as keyof Application] ?? "";
            let vb: any = b[sortBy as keyof Application] ?? "";
            if (sortBy === "match") { va = +va; vb = +vb; }
            const cmp = va < vb ? -1 : va > vb ? 1 : 0;
            return sortDir === "desc" ? -cmp : cmp;
        });

    // Stats
    const total = apps.length;
    const inProgress = apps.filter(a => ["OA Received", "OA Done"].includes(a.status)).length;
    const interviews = apps.filter(a => a.status === "Interview").length;
    const offers = apps.filter(a => a.status === "Offer").length;

    const toggleSort = (key: typeof sortBy) => {
        if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortBy(key); setSortDir("desc"); }
    };

    const SortIcon = ({ key: k }: { key: typeof sortBy }) =>
        sortBy === k ? (sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null;

    if (!mounted) return null;

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 pb-12 animate-fade-in">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight font-geist">Placement Tracker</h1>
                        <p className="text-sm text-gray-500 dark:text-[#71717A] mt-0.5">Apply to 100 companies by Aug 2026</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(v => !v)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={16} /> Add Application
                </button>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Applied", value: total, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" },
                    { label: "In Progress", value: inProgress, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30" },
                    { label: "Interviews", value: interviews, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30" },
                    { label: "Offers 🎉", value: offers, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30" },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-5">
                        <p className="text-2xl font-bold font-geist text-gray-900 dark:text-[#F5F5F5]">{s.value}</p>
                        <p className="text-xs text-gray-500 dark:text-[#71717A] mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* PROGRESS BAR */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4 flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-[#A1A1AA] whitespace-nowrap">{total} / {MOCK_TARGET} companies</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-[#1F1F1F] rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (total / MOCK_TARGET) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-blue-600 rounded-full"
                    />
                </div>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{Math.round((total / MOCK_TARGET) * 100)}%</span>
            </div>

            {/* ADD FORM */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5]">New Application</h3>
                            <button onClick={() => setShowAddForm(false)}><X size={18} className="text-gray-400 hover:text-gray-700 dark:hover:text-white" /></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {[
                                { label: "Company *", value: company, set: setCompany, placeholder: "e.g. Razorpay" },
                                { label: "Role *", value: role, set: setRole, placeholder: "e.g. SDE Intern" },
                                { label: "Location", value: location, set: setLocation, placeholder: "e.g. Bengaluru / Remote" },
                            ].map(f => (
                                <div key={f.label} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">{f.label}</label>
                                    <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                                        className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40" />
                                </div>
                            ))}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">Date Applied</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">Source</label>
                                <select value={source} onChange={e => setSource(e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40">
                                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">Match % ({match}%)</label>
                                <input type="range" min={0} max={100} value={match} onChange={e => setMatch(+e.target.value)} className="w-full accent-blue-600" />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">JD Link (optional)</label>
                                <input value={jdUrl} onChange={e => setJdUrl(e.target.value)} placeholder="https://..."
                                    className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#0D0D0D] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40" />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-500 dark:text-[#71717A] hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleAddApp} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">Add Application</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FILTER + SEARCH BAR */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or role..."
                        className="w-full h-10 pl-9 pr-4 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#111111] rounded-xl text-gray-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600/40" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(["All", ...STATUSES] as const).map(s => (
                        <button key={s} onClick={() => setFilterStatus(s as any)}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                filterStatus === s ? "bg-blue-600 text-white border-transparent" : "bg-white dark:bg-[#111111] text-gray-600 dark:text-[#A1A1AA] border-gray-200 dark:border-[#1F1F1F] hover:border-blue-300")}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* APPLICATION TABLE */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-[#0D0D0D] border-b border-gray-200 dark:border-[#1F1F1F]">
                        <tr>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Company</th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Role</th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Source</th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider cursor-pointer hover:text-blue-600 select-none" onClick={() => toggleSort("date")}>
                                <span className="flex items-center gap-1">Date <SortIcon key="date" /></span>
                            </th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider cursor-pointer hover:text-blue-600 select-none" onClick={() => toggleSort("match")}>
                                <span className="flex items-center gap-1">Match% <SortIcon key="match" /></span>
                            </th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-[#71717A] uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#1F1F1F]">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-16 text-center text-gray-400 dark:text-[#52525B]">No applications yet. Click "Add Application" to start! 🎯</td></tr>
                        ) : filtered.map(app => (
                            <tr key={app.id} className="hover:bg-gray-50/50 dark:hover:bg-[#0D0D0D] transition-colors">
                                <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-[#F5F5F5]">
                                    <div className="flex items-center gap-2">
                                        {app.company}
                                        {app.jdUrl && <a href={app.jdUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} className="text-gray-400 hover:text-blue-500" /></a>}
                                    </div>
                                    {app.location && <span className="text-xs text-gray-400 dark:text-[#52525B]">{app.location}</span>}
                                </td>
                                <td className="px-5 py-3.5 text-gray-700 dark:text-[#A1A1AA]">{app.role}</td>
                                <td className="px-5 py-3.5 text-gray-500 dark:text-[#71717A]">{app.source}</td>
                                <td className="px-5 py-3.5 text-gray-500 dark:text-[#71717A] whitespace-nowrap">{app.date}</td>
                                <td className="px-5 py-3.5">
                                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                                        app.match >= 75 ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                            : app.match >= 50 ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400")}>
                                        {app.match}%
                                    </span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <select
                                        value={app.status}
                                        onChange={e => handleStatusChange(app.id, e.target.value as AppStatus)}
                                        className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/40", STATUS_CONFIG[app.status].color)}
                                    >
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-5 py-3.5">
                                    <button onClick={() => handleDelete(app.id)} className="p-1.5 text-gray-300 dark:text-[#3F3F46] hover:text-red-500 dark:hover:text-red-400 transition-colors rounded">
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MOCK INTERVIEW LOG */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-[#F5F5F5] flex items-center gap-2">
                            <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" /> Mock Interview Log
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-[#71717A]">Goal: {mocks.length} / 20 mocks done</p>
                    </div>
                    <button onClick={() => setShowMockForm(v => !v)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                        <Plus size={15} /> Add Mock
                    </button>
                </div>

                {/* Progress */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-[#1F1F1F] rounded-full overflow-hidden mb-5">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (mocks.length / 20) * 100)}%` }} />
                </div>

                <AnimatePresence>
                    {showMockForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="mb-5 p-4 bg-gray-50 dark:bg-[#0D0D0D] rounded-xl border border-gray-100 dark:border-[#1F1F1F] overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">Date</label>
                                    <input type="date" value={mockDate} onChange={e => setMockDate(e.target.value)}
                                        className="w-full h-9 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#111111] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">Topic</label>
                                    <select value={mockTopic} onChange={e => setMockTopic(e.target.value as any)}
                                        className="w-full h-9 px-3 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#111111] rounded-lg text-gray-900 dark:text-[#F5F5F5] focus:outline-none">
                                        {["DSA", "System Design", "HR"].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-[#71717A]">Rating (1–5)</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button key={n} onClick={() => setMockRating(n)}>
                                                <Star size={20} className={n <= mockRating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-[#3F3F46]"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <textarea value={mockNotes} onChange={e => setMockNotes(e.target.value)} placeholder="What went well? What to improve?"
                                className="w-full h-20 px-3 py-2 text-sm border border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#111111] rounded-lg text-gray-900 dark:text-[#F5F5F5] resize-none focus:outline-none mb-3" />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowMockForm(false)} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleAddMock} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">Save</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-3">
                    {mocks.map(m => (
                        <div key={m.id} className="flex items-start gap-4 p-3 rounded-xl bg-gray-50 dark:bg-[#0D0D0D] border border-gray-100 dark:border-[#1F1F1F]">
                            <div className="shrink-0 text-center">
                                <p className="text-[10px] text-gray-400 dark:text-[#52525B]">{m.date}</p>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{m.topic}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex gap-0.5 mb-1">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={12} className={n <= m.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-[#2A2A2A]"} />)}</div>
                                <p className="text-sm text-gray-700 dark:text-[#A1A1AA] line-clamp-2">{m.notes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

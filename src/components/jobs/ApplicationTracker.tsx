"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, ExternalLink, Brain, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

type AppStatus = "Applied" | "OA Received" | "Interview Scheduled" | "Interview Done" | "Offer" | "Rejected" | "Ghosted";

interface Application {
    id: string;
    company: string;
    role: string;
    status: AppStatus;
    applied_date: string;
    deadline: string | null;
    job_url: string | null;
    notes: string | null;
    logo_url: string | null;
    intel_cached: boolean;
    created_at: string;
}

interface ApplicationTrackerProps {
    onViewIntel?: (company: string) => void;
}

const KANBAN_COLUMNS: AppStatus[] = [
    "Applied",
    "OA Received",
    "Interview Scheduled",
    "Interview Done",
    "Offer",
    "Rejected",
];

const STATUS_CONFIG: Record<AppStatus, { bg: string; border: string; badge: string; dot: string }> = {
    "Applied": {
        bg: "bg-surface/60",
        border: "border-border/60 border-t-[4px] border-t-blue-500",
        badge: "bg-blue-500/10 text-blue-500 border-none shadow-sm",
        dot: "bg-blue-500",
    },
    "OA Received": {
        bg: "bg-surface/60",
        border: "border-border/60 border-t-[4px] border-t-amber-500",
        badge: "bg-amber-500/10 text-amber-500 border-none shadow-sm",
        dot: "bg-amber-500",
    },
    "Interview Scheduled": {
        bg: "bg-surface/60",
        border: "border-border/60 border-t-[4px] border-t-indigo-500",
        badge: "bg-indigo-500/10 text-indigo-500 border-none shadow-sm",
        dot: "bg-indigo-500",
    },
    "Interview Done": {
        bg: "bg-surface/60",
        border: "border-border/60 border-t-[4px] border-t-violet-500",
        badge: "bg-violet-500/10 text-violet-500 border-none shadow-sm",
        dot: "bg-violet-500",
    },
    "Offer": {
        bg: "bg-surface/60",
        border: "border-border/60 border-t-[4px] border-t-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-500 border-none shadow-sm",
        dot: "bg-emerald-500",
    },
    "Rejected": {
        bg: "bg-surface/60",
        border: "border-border/60 border-t-[4px] border-t-error",
        badge: "bg-error/10 text-error border-none shadow-sm",
        dot: "bg-error",
    },
    "Ghosted": {
        bg: "bg-surface/60",
        border: "border-border/60 border-t-[4px] border-t-text-muted",
        badge: "bg-text-muted/10 text-text-muted border-none shadow-sm",
        dot: "bg-text-muted",
    },
};

export default function ApplicationTracker({ onViewIntel }: ApplicationTrackerProps) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [expandedApp, setExpandedApp] = useState<string | null>(null);

    // Add form state
    const [formCompany, setFormCompany] = useState("");
    const [formRole, setFormRole] = useState("");
    const [formUrl, setFormUrl] = useState("");
    const [formNotes, setFormNotes] = useState("");
    const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
    const [formDeadline, setFormDeadline] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch("/api/applications");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setApplications(data.applications ?? []);
        } catch {
            // fallback to empty
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!formCompany.trim() || !formRole.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company: formCompany,
                    role: formRole,
                    job_url: formUrl || null,
                    notes: formNotes || null,
                    applied_date: formDate,
                    deadline: formDeadline || null,
                }),
            });
            if (res.ok) {
                const { application } = await res.json();
                setApplications((prev) => [application, ...prev]);
                setFormCompany(""); setFormRole(""); setFormUrl(""); setFormNotes(""); setFormDeadline("");
                setShowAddForm(false);

                // Confetti on add
                if (formCompany.trim()) {
                    import("@/lib/confetti").then((m) => m.triggerConfetti()).catch(() => { });
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, status: AppStatus) => {
        setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
        await fetch(`/api/applications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (status === "Offer") {
            import("@/lib/confetti").then((m) => m.triggerConfetti()).catch(() => { });
        }
    };

    const handleDelete = async (id: string) => {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        await fetch(`/api/applications/${id}`, { method: "DELETE" });
    };

    const handleDragEnd = (result: DropResult) => {
        const { draggableId, destination } = result;
        if (!destination) return;
        const newStatus = destination.droppableId as AppStatus;
        handleStatusChange(draggableId, newStatus);
    };

    // Stats
    const total = applications.length;
    const active = applications.filter((a) => !["Offer", "Rejected", "Ghosted"].includes(a.status)).length;
    const interviews = applications.filter((a) => ["Interview Scheduled", "Interview Done"].includes(a.status)).length;
    const offers = applications.filter((a) => a.status === "Offer").length;
    const rejected = applications.filter((a) => a.status === "Rejected").length;
    const rejectRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { label: "Total Apps", value: total, color: "text-text-primary" },
                    { label: "Active", value: active, color: "text-blue-500" },
                    { label: "Interviews", value: interviews, color: "text-indigo-500" },
                    { label: "Offers", value: offers, color: "text-emerald-500" },
                    { label: "Reject Rate", value: `${rejectRate}%`, color: "text-error" },
                ].map((s) => (
                    <div key={s.label} className="bg-surface border border-border shadow-sm rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center">
                        <div className={cn("text-4xl sm:text-5xl font-bold tracking-tight", s.color)}>{s.value}</div>
                        <div className="text-xs font-bold text-text-muted mt-3 uppercase tracking-widest">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <h3 className="text-xl font-bold text-text-primary tracking-tight ">Application Pipeline</h3>
                <button
                    onClick={() => setShowAddForm((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-text-primary hover:bg-text-secondary text-background text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    New Entry
                </button>
            </div>

            {/* Add Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-surface border border-border shadow-sm rounded-xl p-5 sm:p-6 mt-4">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                                <h4 className="text-lg font-bold text-text-primary  tracking-tight">New Application Record</h4>
                                <button onClick={() => setShowAddForm(false)}>
                                    <X size={16} className="text-text-muted hover:text-text-primary" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-6">
                                {[
                                    { label: "Company *", value: formCompany, set: setFormCompany, placeholder: "e.g. Razorpay" },
                                    { label: "Role *", value: formRole, set: setFormRole, placeholder: "e.g. SDE Intern" },
                                ].map((f) => (
                                    <div key={f.label} className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{f.label}</label>
                                        <input
                                            value={f.value}
                                            onChange={(e) => f.set(e.target.value)}
                                            placeholder={f.placeholder}
                                            className="w-full h-12 px-4 text-sm border border-border/80 bg-surface rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all shadow-inner"
                                        />
                                    </div>
                                ))}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Applied Date</label>
                                    <input
                                        type="date"
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        className="w-full h-12 px-4 text-sm border border-border/80 bg-surface rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Deadline</label>
                                    <input
                                        type="date"
                                        value={formDeadline}
                                        onChange={(e) => setFormDeadline(e.target.value)}
                                        className="w-full h-12 px-4 text-sm border border-border/80 bg-surface rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Job URL</label>
                                    <input
                                        value={formUrl}
                                        onChange={(e) => setFormUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full h-12 px-4 text-sm border border-border/80 bg-surface rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-3">
                                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Notes</label>
                                    <textarea
                                        value={formNotes}
                                        onChange={(e) => setFormNotes(e.target.value)}
                                        placeholder="Any notes about this application..."
                                        rows={3}
                                        className="w-full px-4 py-3 text-sm border border-border/80 bg-surface rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 resize-none transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-5 border-t border-border/40">
                                <button onClick={() => setShowAddForm(false)} className="px-5 py-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest rounded-lg hover:bg-background">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={submitting || !formCompany.trim() || !formRole.trim()}
                                    className="px-6 py-2 bg-text-primary hover:bg-text-secondary text-background text-sm font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 shadow-sm active:scale-95"
                                >
                                    {submitting ? "Saving..." : "Save Record"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kanban Board */}
            {loading ? (
                <div className="h-48 flex items-center justify-center text-text-muted animate-pulse">
                    Loading applications...
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-2">
                        {KANBAN_COLUMNS.map((col) => {
                            const colApps = applications.filter((a) => a.status === col);
                            const cfg = STATUS_CONFIG[col];
                            return (
                                <div key={col} className="min-w-[280px] xl:min-w-0">
                                    {/* Column header */}
                                    <div className={cn("flex items-center gap-2 px-4 py-3 bg-surface border-b", cfg.border, "rounded-t-xl shadow-sm")}>
                                        <span className="text-base font-bold text-text-primary tracking-tight">{col}</span>
                                        <span className={cn("ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full", cfg.badge)}>
                                            {colApps.length}
                                        </span>
                                    </div>

                                    <Droppable droppableId={col}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={cn(
                                                    "min-h-[240px] p-2 sm:p-3 rounded-b-xl border border-border/40 border-t-0 space-y-3",
                                                    "bg-background/50",
                                                    snapshot.isDraggingOver && "bg-background"
                                                )}
                                            >
                                                {colApps.map((app, idx) => (
                                                    <Draggable key={app.id} draggableId={app.id} index={idx}>
                                                        {(prov, snap) => (
                                                            <div
                                                                ref={prov.innerRef}
                                                                {...prov.draggableProps}
                                                                {...prov.dragHandleProps}
                                                                className={cn(
                                                                    "bg-surface border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md relative overflow-hidden group/card",
                                                                    snap.isDragging && "shadow-xl ring-1 ring-accent z-50 scale-[1.02]",
                                                                    !snap.isDragging && "shadow-sm"
                                                                )}
                                                            >
                                                                <div className={cn("absolute top-0 left-0 w-1 h-full", cfg.dot)} />

                                                                {/* Card header */}
                                                                <div className="flex items-start gap-4 mb-4 pl-1">
                                                                    <div className="w-12 h-12 rounded-2xl border border-border/80 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                                                        {app.logo_url ? (
                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                            <img
                                                                                src={app.logo_url}
                                                                                alt={app.company}
                                                                                className="w-full h-full object-contain p-1.5"
                                                                                onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                                                                            />
                                                                        ) : (
                                                                            <span className="text-sm font-bold text-text-muted">{app.company.charAt(0)}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                                        <p className="text-sm font-bold text-text-primary truncate tracking-tight">{app.company}</p>
                                                                        <p className="text-xs font-semibold text-text-secondary truncate mt-0.5">{app.role}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                                                                        className="p-1.5 text-text-muted hover:text-text-primary shrink-0 transition-colors rounded-xl hover:bg-surface"
                                                                    >
                                                                        <ChevronDown size={16} className={cn("transition-transform", expandedApp === app.id && "rotate-180")} />
                                                                    </button>
                                                                </div>

                                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1 mb-1">{app.applied_date}</p>

                                                                {/* Expanded actions */}
                                                                <AnimatePresence>
                                                                    {expandedApp === app.id && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: "auto" }}
                                                                            exit={{ opacity: 0, height: 0 }}
                                                                            className="overflow-hidden pl-1"
                                                                        >
                                                                            <div className="pt-4 mt-4 border-t border-border/40 flex items-center gap-2">
                                                                                <button
                                                                                    onClick={() => onViewIntel?.(app.company)}
                                                                                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-widest text-text-primary border border-border/80 bg-surface rounded-xl hover:bg-background transition-all shadow-sm uppercase"
                                                                                >
                                                                                    <Brain size={14} />
                                                                                    Intel
                                                                                </button>
                                                                                {app.job_url && (
                                                                                    <a
                                                                                        href={app.job_url}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-widest text-text-primary border border-border/80 bg-surface rounded-xl hover:bg-background transition-all shadow-sm uppercase"
                                                                                    >
                                                                                        <ExternalLink size={14} />
                                                                                        JD
                                                                                    </a>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => handleDelete(app.id)}
                                                                                    className="ml-auto p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-colors"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>

                                                                            {/* Quick status change */}
                                                                            <div className="mt-4">
                                                                                <select
                                                                                    value={app.status}
                                                                                    onChange={(e) => handleStatusChange(app.id, e.target.value as AppStatus)}
                                                                                    className="w-full h-10 px-3 text-xs font-semibold border border-border/80 bg-surface rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all shadow-inner uppercase tracking-wider"
                                                                                >
                                                                                    {KANBAN_COLUMNS.map((s) => (
                                                                                        <option key={s} value={s}>{s}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {colApps.length === 0 && (
                                                    <div className="flex items-center justify-center py-6 text-text-muted text-[10px] font-bold uppercase tracking-widest border border-dashed border-border rounded-lg bg-surface/50">
                                                        Drop Here
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            )}
        </div>
    );
}

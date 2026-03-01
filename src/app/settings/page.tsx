"use client";

import { useState, useEffect } from "react";
import { Palette, Grid3x3, Bell, User, Trash2, Eye, EyeOff, Plus, Camera, Github, Twitter, Sparkles, Sun, Moon, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getQuickLinks, updateQuickLinks, QuickLink, MOCK_QUICK_LINKS } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const [links, setLinks] = useState<QuickLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSavingLinks, setIsSavingLinks] = useState(false);
    const [hasUnsavedLinks, setHasUnsavedLinks] = useState(false);

    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const [apiKey, setApiKey] = useState("");

    const [profileImage, setProfileImage] = useState<string>("https://lh3.googleusercontent.com/aida-public/AB6AXuAaQEmJtfG0nXsUEWFhy74r-2DUzRqI2V1InCYadU5FBRP317NktmRZ2B3bJKH8LAx1KKMwmk1vfB6pZ62E9s4fTu2I0xEskIGX398FmcrQnCf4tzzvtphRcdZc6L7SgFJ9CCGKJ1ZUK2Z6j7suuUpgrjGmtL1rVZLlsm5dL9e_yTEoFl_-sYzUEOI8RQOxDOIFRV7Md0-rvvIFjM6pWRxkCa2dEtmg0yuJDFhbv5jRttewt2W81Lv8e9DuKeIa3MQ2ttcGImdU5tc");
    const [fullName, setFullName] = useState("Pranav Gawai");
    const [username, setUsername] = useState("pranavgawai");

    useEffect(() => {
        setMounted(true);
        getQuickLinks().then((data) => {
            setLinks(data.sort((a, b) => a.position - b.position));
            setLoading(false);
        });

        const storedImg = localStorage.getItem('dex_profile_image');
        const storedName = localStorage.getItem('dex_full_name');
        const storedUser = localStorage.getItem('dex_username');
        if (storedImg) setProfileImage(storedImg);
        if (storedName) setFullName(storedName);
        if (storedUser) setUsername(storedUser);
    }, []);

    const handleLinksChange = (updated: QuickLink[]) => {
        setLinks(updated);
        setHasUnsavedLinks(true);
    };

    const handleSaveLinks = async () => {
        setIsSavingLinks(true);
        try {
            await updateQuickLinks(links);
            // Re-fetch to get real IDs for any temp items
            const fresh = await getQuickLinks();
            setLinks(fresh.sort((a, b) => a.position - b.position));
            setHasUnsavedLinks(false);
            router.refresh();
            alert("Quick Links saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save links.");
        } finally {
            setIsSavingLinks(false);
        }
    };

    const handleAddLink = () => {
        const newLink: QuickLink = {
            id: `temp_${Date.now()}`,
            label: "New Link",
            url: "https://",
            icon_name: "Link",
            position: links.length ? Math.max(...links.map(l => l.position)) + 1 : 1,
            category: "General"
        };
        handleLinksChange([...links, newLink]);
    };

    const handleDeleteLink = (id: string) => {
        handleLinksChange(links.filter(l => l.id !== id));
    };

    const handleResetLinks = () => {
        if (confirm("Reset all Quick Launch links to premium defaults? This will overwrite your current links.")) {
            handleLinksChange(MOCK_QUICK_LINKS);
            alert("Links reset to defaults. Don't forget to 'Save Changes'!");
        }
    };

    const handleUpdateLink = (id: string, field: keyof QuickLink, value: string) => {
        handleLinksChange(links.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setProfileImage(base64);
                localStorage.setItem('dex_profile_image', base64);
                // Dispatch event for other tabs (TopBar)
                window.dispatchEvent(new Event('storage'));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileUpdate = () => {
        localStorage.setItem('dex_full_name', fullName);
        localStorage.setItem('dex_username', username);
        window.dispatchEvent(new Event('storage'));
        alert("Profile identity updated successfully!");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 pt-2 animate-fade-in">

            {/* SECTION 1: Appearance */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Palette className="size-5 text-accent" />
                    <h2 className="text-base font-semibold text-text-primary">Appearance</h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        {
                            id: 'light',
                            label: 'Light',
                            desc: 'Clean & Bright',
                            icon: <Sun className="size-5 text-amber-500" />
                        },
                        {
                            id: 'charcoal',
                            label: 'Charcoal',
                            desc: 'Premium Soft Dark',
                            icon: (
                                <div className="relative">
                                    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" className="text-blue-400">
                                        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M9 2 A7 7 0 0 1 9 16 Z" fill="currentColor" fillOpacity="0.65" />
                                        <circle cx="9" cy="9" r="2" fill="currentColor" />
                                    </svg>
                                    <div className="absolute -top-1 -right-1 size-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                </div>
                            )
                        },
                        {
                            id: 'dark',
                            label: 'Dark',
                            desc: 'Elite Deep Black',
                            icon: <Moon className="size-5 text-indigo-400" />
                        }
                    ].map((t) => {
                        const isSelected = mounted && theme === t.id;
                        return (
                            <div
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={cn(
                                    "px-4 py-6 rounded-xl border-2 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 shadow-sm relative overflow-hidden",
                                    isSelected
                                        ? "border-accent bg-accent/10 text-accent scale-[1.02] shadow-md"
                                        : "border-border bg-background text-text-secondary hover:border-accent/30"
                                )}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="premium-selection"
                                        className="absolute inset-0 bg-accent/5 pointer-events-none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    />
                                )}
                                <div className={cn(
                                    "size-10 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                                    isSelected
                                        ? "bg-accent text-white shadow-lg shadow-accent/30"
                                        : "bg-surface border border-border"
                                )}>
                                    {t.icon}
                                </div>
                                <div className="text-center z-10">
                                    <span className="text-[12px] font-extrabold uppercase tracking-[0.15em] block">{t.label}</span>
                                    <span className="text-[10px] opacity-60 font-medium block mt-1">{t.desc}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* SECTION 2: Quick Links Manager */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-1">
                    <Grid3x3 className="size-5 text-accent" />
                    <h2 className="text-base font-semibold text-text-primary">Quick Launch Links</h2>
                </div>
                <p className="text-sm text-text-secondary mb-6">These appear on your home dashboard as high-priority quick launch buttons.</p>

                {loading ? <div className="text-sm">Loading...</div> : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-background border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-text-primary w-12">#</th>
                                    <th className="px-4 py-3 font-semibold text-text-primary">Label</th>
                                    <th className="px-4 py-3 font-semibold text-text-primary">Icon Name</th>
                                    <th className="px-4 py-3 font-semibold text-text-primary">URL</th>
                                    <th className="px-4 py-3 font-semibold text-text-primary w-16">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {links.map((link, idx) => (
                                    <tr key={link.id} className="hover:bg-background group transition-colors">
                                        <td className="px-4 py-2 text-text-muted">{idx + 1}</td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={link.label}
                                                onChange={(e) => handleUpdateLink(link.id, 'label', e.target.value)}
                                                className="bg-transparent border-0 border-b border-transparent hover:border-border focus:border-accent focus:outline-none px-1 py-1 w-full text-text-primary transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={link.icon_name}
                                                onChange={(e) => handleUpdateLink(link.id, 'icon_name', e.target.value)}
                                                placeholder="Lucide Name (e.g. Code)"
                                                className="bg-transparent border-0 border-b border-transparent hover:border-border focus:border-accent focus:outline-none px-1 py-1 w-full text-text-secondary text-xs transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={link.url}
                                                onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                                                className="bg-transparent border-0 border-b border-transparent hover:border-border focus:border-accent focus:outline-none px-1 py-1 w-full text-text-secondary font-mono text-xs transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => handleDeleteLink(link.id)}
                                                className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-[#1F1F1F] pt-4">
                    <button
                        onClick={handleAddLink}
                        className="flex items-center gap-1.5 text-sm font-medium text-accent hover:bg-accent/10 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-accent/30"
                    >
                        <Plus className="size-4" /> Add Link
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleResetLinks}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                        >
                            Reset to Defaults
                        </button>
                        {hasUnsavedLinks && (
                            <button
                                onClick={handleSaveLinks}
                                disabled={isSavingLinks}
                                className="bg-text-primary text-background px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSavingLinks ? "Saving..." : "Save Changes"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 3: Notification Reminders */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Bell className="size-5 text-accent" />
                    <h2 className="text-base font-semibold text-text-primary">Reminders</h2>
                </div>

                <div className="space-y-4 divide-y divide-border">
                    {[
                        { label: 'Evening log reminder', time: '21:30', active: true },
                        { label: 'DSA daily reminder', time: '19:00', active: false },
                        { label: 'GitHub commit reminder', time: '22:00', active: true }
                    ].map((reminder, i) => (
                        <div key={i} className={cn("flex items-center justify-between", i !== 0 && "pt-4")}>
                            <span className="text-sm font-medium text-text-primary">{reminder.label}</span>
                            <div className="flex items-center gap-4">
                                <input
                                    type="time"
                                    defaultValue={reminder.time}
                                    className="bg-background border border-border text-text-primary text-sm rounded-lg px-2 py-1 outline-none"
                                />
                                <div className={cn(
                                    "relative w-11 h-6 rounded-full cursor-pointer flex items-center px-1 transition-colors",
                                    reminder.active ? "bg-accent" : "bg-border"
                                )}>
                                    <div className={cn(
                                        "size-4 rounded-full bg-white transition-transform",
                                        reminder.active ? "translate-x-5" : "translate-x-0"
                                    )} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 4: Profile */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-background/50">
                    <div className="flex items-center gap-2">
                        <User className="size-5 text-accent" />
                        <h2 className="text-base font-bold text-text-primary">Profile Branding</h2>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        {/* Left: Avatar Upload */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
                                Profile Identity
                            </label>
                            <div className="relative group">
                                <div className="size-32 rounded-3xl overflow-hidden border-4 border-surface shadow-xl ring-1 ring-border relative">
                                    <img
                                        alt="PG"
                                        src={profileImage}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
                                        <Camera className="size-6 text-white" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-tight">Change</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 size-8 rounded-xl bg-accent border-4 border-surface flex items-center justify-center shadow-lg">
                                    <ShieldCheck className="size-3.5 text-white" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 px-1">
                                <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">Premium Plus</span>
                                <span className="text-[10px] text-text-muted">Member since Feb 2026</span>
                            </div>
                        </div>

                        {/* Right: Info Fields */}
                        <div className="flex-1 w-full space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2 ml-1">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">@</span>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 pl-8 text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Engine Authentication</h3>

                                <div className="space-y-4">
                                    {/* Gemini */}
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2 ml-1">
                                            <Sparkles className="size-3 text-accent" /> Gemini API Pro Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={apiKeyVisible ? "text" : "password"}
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="Enter your high-performance API key"
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary pr-12 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                            />
                                            <button
                                                onClick={() => setApiKeyVisible(!apiKeyVisible)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-accent transition-colors"
                                            >
                                                {apiKeyVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Social Integrations */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Github className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                                            <input
                                                type="text"
                                                defaultValue="pranavgawai"
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-text-primary outline-none focus:border-accent transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                                            <input
                                                type="text"
                                                defaultValue="pranavgawai_"
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-text-primary outline-none focus:border-accent transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, Command, Sun, Moon, Sparkles, RefreshCw, X, Lightbulb, ExternalLink, Linkedin, Eye, EyeOff, Clock, Settings, ShieldCheck, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

function getGreeting(hour: number): string {
    if (hour < 5) return "Late night grind";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function getMotivationCaption(hour: number): string {
    if (hour < 5) return "Burning the midnight oil. Don't forget to rest!";
    if (hour < 12) return "A fresh start. Let's tackle that first task.";
    if (hour < 17) return "Stay focused. You're making great progress today.";
    return "Time to wrap up and reflect on today's wins.";
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

interface SuggestionData {
    x_post: { content: string; best_time: string; type: string; };
    linkedin_post: { content: string; best_time: string; type: string; };
    tip: string;
    generated_at: string;
}

function getGeminiUsage() {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem('dex_gemini_usage');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            const today = new Date().toISOString().split('T')[0];
            if (parsed.date === today) return parsed.count;
        } catch (e) { }
    }
    return 0;
}

export default function TopBar() {
    const [now, setNow] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestionData | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [geminiUsage, setGeminiUsage] = useState(0);
    const [isClockHidden, setIsClockHidden] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Live Deep Scan States
    const [isScanning, setIsScanning] = useState(false);
    const [scanStep, setScanStep] = useState("");
    const [scanProgress, setScanProgress] = useState(0);

    // Profile Sync States
    const [profileImage, setProfileImage] = useState<string>("https://lh3.googleusercontent.com/aida-public/AB6AXuAaQEmJtfG0nXsUEWFhy74r-2DUzRqI2V1InCYadU5FBRP317NktmRZ2B3bJKH8LAx1KKMwmk1vfB6pZ62E9s4fTu2I0xEskIGX398FmcrQnCf4tzzvtphRcdZc6L7SgFJ9CCGKJ1ZUK2Z6j7suuUpgrjGmtL1rVZLlsm5dL9e_yTEoFl_-sYzUEOI8RQOxDOIFRV7Md0-rvvIFjM6pWRxkCa2dEtmg0yuJDFhbv5jRttewt2W81Lv8e9DuKeIa3MQ2ttcGImdU5tc");
    const [fullName, setFullName] = useState("Pranav Gawai");
    const [username, setUsername] = useState("pranavgawai");

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 1000);
        setGeminiUsage(getGeminiUsage());

        const syncProfile = () => {
            const storedImg = localStorage.getItem('dex_profile_image');
            const storedName = localStorage.getItem('dex_full_name');
            const storedUser = localStorage.getItem('dex_username');
            if (storedImg) setProfileImage(storedImg);
            if (storedName) setFullName(storedName);
            if (storedUser) setUsername(storedUser);
            setGeminiUsage(getGeminiUsage());
        };

        syncProfile();
        window.addEventListener('storage', syncProfile);

        // Load clock visibility
        const storedHidden = localStorage.getItem('dex_clock_hidden');
        if (storedHidden === 'true') {
            setIsClockHidden(true);
        }

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', syncProfile);
        };
    }, []);

    // Load suggestions from local storage if valid
    useEffect(() => {
        const stored = localStorage.getItem('dex_ai_suggestions');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.generated_at) {
                    const diffMins = (new Date().getTime() - new Date(parsed.generated_at).getTime()) / 60000;
                    if (diffMins < 30) {
                        setSuggestions(parsed);
                    }
                }
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (force = false) => {
        if (!force && suggestions) {
            const diffMins = (new Date().getTime() - new Date(suggestions.generated_at).getTime()) / 60000;
            if (diffMins < 30) return;
        }

        setLoadingSuggestions(true);
        try {
            const res = await fetch('/api/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lcSolved: 50, // mock payload, API route will fetch actual
                    dsaStreak: 12,
                    recentChapter: "Graphs",
                    todayDate: new Date().toISOString()
                })
            });
            const data = await res.json();
            if (data.x_post) {
                setSuggestions(data);
                localStorage.setItem('dex_ai_suggestions', JSON.stringify(data));

                // Track usage
                const today = new Date().toISOString().split('T')[0];
                const newUsage = getGeminiUsage() + 1;
                localStorage.setItem('dex_gemini_usage', JSON.stringify({ count: newUsage, date: today }));
                setGeminiUsage(newUsage);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSuggestions(false);
        }
    };
    const runDeepScan = async () => {
        if (isScanning) return;
        setIsScanning(true);
        setScanProgress(0);

        const steps = [
            "Initializing Engine...",
            "Analyzing Local Database...",
            "Scanning Website Assets...",
            "Calculating Gemini Pulse...",
            "Syncing Cloud Usage...",
            "Scan Complete."
        ];

        for (let i = 0; i < steps.length; i++) {
            setScanStep(steps[i]);
            setScanProgress((i + 1) * (100 / steps.length));
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        }

        setGeminiUsage(getGeminiUsage());
        setTimeout(() => {
            setIsScanning(false);
            setScanProgress(0);
        }, 800);
    };


    const handleDropdownToggle = () => {
        const nextState = !isDropdownOpen;
        setIsDropdownOpen(nextState);
        setGeminiUsage(getGeminiUsage());
        if (nextState) {
            fetchSuggestions(false);
        }
    };

    const handleUsePost = (platform: 'x' | 'linkedin', content: string) => {
        setIsDropdownOpen(false);
        localStorage.setItem(`dex_draft_${platform}`, content);
        router.push(`/post-lab?platform=${platform}&draft=true`);
    };

    const toggleClockVisibility = () => {
        const newState = !isClockHidden;
        setIsClockHidden(newState);
        localStorage.setItem('dex_clock_hidden', newState.toString());
    };

    const handleLogout = () => {
        // Mock logout
        router.push('/login');
    };

    return (
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0 z-20">
            {/* Left: Clock + Date */}
            <div className="flex flex-col justify-center min-w-[200px] relative group/clock">
                {mounted && now ? (
                    <AnimatePresence mode="wait">
                        {!isClockHidden ? (
                            <motion.div
                                key="clock-visible"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex flex-col relative"
                            >
                                <span className="text-lg font-semibold text-text-primary font-mono tabular-nums tracking-wide pr-8">
                                    {formatTime(now)}
                                </span>
                                <span className="text-xs text-text-secondary">
                                    {formatDate(now)}
                                </span>
                                <button
                                    onClick={toggleClockVisibility}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/clock:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1A1A1A] text-gray-400 dark:text-[#3F3F46] hover:text-gray-600 dark:hover:text-[#71717A] transition-all"
                                    title="Hide Date/Time"
                                >
                                    <EyeOff className="size-3.5" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="clock-hidden"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center"
                            >
                                <button
                                    onClick={toggleClockVisibility}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-border text-text-muted hover:border-accent hover:text-text-primary transition-all group/show"
                                >
                                    <Clock className="size-3.5 group-hover/show:text-accent transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Show Clock</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                ) : (
                    <>
                        <span className="text-lg font-semibold text-gray-900 dark:text-[#F5F5F5] font-mono">--:--:-- --</span>
                        <span className="text-xs text-gray-500 dark:text-[#71717A]">Loading...</span>
                    </>
                )}
            </div>

            {/* Center: Greeting */}
            <div className="flex-1 flex flex-col items-center justify-center -mt-0.5">
                {mounted && now ? (
                    <div className="flex flex-col items-center animate-fade-in">
                        <h2 className="text-[17px] font-semibold text-text-primary font-geist tracking-tight leading-snug">
                            {getGreeting(now.getHours())}, Pranav
                        </h2>
                        <p className="text-[11px] text-text-secondary font-medium tracking-wide">
                            {getMotivationCaption(now.getHours())}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center opacity-0">
                        <h2 className="text-[17px] font-semibold">...</h2>
                        <p className="text-[11px]">...</p>
                    </div>
                )}
            </div>

            {/* Right: Search + Notification */}
            <div className="flex items-center gap-4 min-w-[300px] justify-end">
                {/* Search */}
                <div
                    className="relative group cursor-pointer"
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                        document.dispatchEvent(event);
                    }}
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted group-focus-within:text-accent transition-colors duration-200" />
                    <div
                        className="flex items-center w-full min-w-[280px] max-w-[360px] h-10 pl-10 pr-16 bg-background border border-border rounded-lg text-sm text-text-muted hover:border-accent/30 transition-all duration-200"
                    >
                        Search anything...
                    </div>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="flex items-center justify-center h-5 min-w-[20px] px-1.5 py-0.5 text-[10px] font-mono font-medium text-text-muted bg-surface border border-border rounded">
                            <Command className="size-2.5" />
                        </kbd>
                        <kbd className="flex items-center justify-center h-5 min-w-[20px] px-1.5 py-0.5 text-[10px] font-mono font-medium text-text-muted bg-surface border border-border rounded">
                            K
                        </kbd>
                    </div>
                </div>

                <div className="flex items-center gap-1 relative" ref={dropdownRef}>
                    {/* Theme Toggle (Three-way Cycle) */}
                    {mounted && (
                        <button
                            onClick={() => {
                                if (theme === 'light') setTheme('charcoal');
                                else if (theme === 'charcoal') setTheme('dark');
                                else setTheme('light');
                            }}
                            className="relative hidden sm:flex items-center justify-center w-9 h-9 text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
                            aria-label="Toggle Theme"
                            title={`Current: ${theme}`}
                        >
                            {theme === 'light' && <Sun className="size-[18px]" />}
                            {theme === 'charcoal' && (
                                <div className="relative">
                                    <Sparkles className="size-[18px] text-blue-500" />
                                    <div className="absolute -top-0.5 -right-0.5 size-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                </div>
                            )}
                            {theme === 'dark' && <Moon className="size-[18px]" />}
                        </button>
                    )}

                    {/* Notification Bell */}
                    <button
                        onClick={handleDropdownToggle}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-background relative cursor-pointer transition-colors"
                        title={`${geminiUsage} credits used today — Gemini Live Premium`}
                    >
                        <Bell className="size-[18px]" />
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-surface">
                            {geminiUsage}
                        </span>
                    </button>

                    {/* Notification Dropdown */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                className="absolute top-11 right-0 w-[300px] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                            >
                                <div className="p-5 space-y-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-[#71717A] uppercase tracking-widest">Resource Engine</span>
                                        </div>
                                        <button
                                            onClick={runDeepScan}
                                            disabled={isScanning}
                                            className="p-1.5 rounded-lg hover:bg-background transition-colors disabled:opacity-30"
                                        >
                                            <RefreshCw className={cn("size-3.5 text-text-muted", isScanning && "animate-spin text-accent")} />
                                        </button>
                                    </div>

                                    {/* Main Metric */}
                                    <div className="text-left py-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-text-primary tabular-nums">
                                                {isScanning ? Math.floor(scanProgress) : ((geminiUsage / 1000) * 100).toFixed(1)}
                                            </span>
                                            <span className="text-sm font-semibold text-text-muted">%</span>
                                        </div>
                                        <p className="text-[10px] font-medium text-text-secondary mt-1">
                                            {isScanning ? scanStep : "Total System Consumption"}
                                        </p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
                                        <div className="bg-surface p-3">
                                            <label className="block text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Quota Used</label>
                                            <span className="text-xs font-bold text-text-primary">{geminiUsage} units</span>
                                        </div>
                                        <div className="bg-surface p-3">
                                            <label className="block text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Daily Limit</label>
                                            <span className="text-xs font-bold text-text-primary">1,000 req</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: isScanning ? `${scanProgress}%` : `${Math.min(100, (geminiUsage / 1000) * 100)}%` }}
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    isScanning ? "bg-accent" : "bg-text-primary"
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-bold text-text-muted uppercase tracking-tighter">
                                            <span>System Reset</span>
                                            <span>{23 - new Date().getHours()}h {59 - new Date().getMinutes()}m remaining</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3.5 bg-background border-t border-border flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                        {isScanning ? "Scanning Engine..." : "Server Status"}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn("size-1.5 rounded-full", isScanning ? "bg-accent animate-pulse" : "bg-success")} />
                                        <span className="text-[10px] font-bold text-text-primary">
                                            {isScanning ? "Syncing" : "Operational"}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Profile */}
                    <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-white/[0.06] hover:ring-2 hover:ring-purple-500/50 transition-all cursor-pointer"
                        >
                            <img
                                alt="PG"
                                src={profileImage}
                                className="w-full h-full object-cover"
                            />
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    className="absolute top-11 right-0 w-[260px] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-border bg-background">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                                                <img
                                                    alt="PG"
                                                    src={profileImage}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-sm font-bold text-text-primary">{fullName}</span>
                                                <span className="text-[10px] text-accent font-bold uppercase tracking-widest">DEX Premium Plus</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2">
                                        <button
                                            onClick={() => { setIsProfileOpen(false); router.push('/settings'); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-all"
                                        >
                                            <Settings className="size-4" />
                                            Settings
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-all">
                                            <ShieldCheck className="size-4" />
                                            Privacy & Security
                                        </button>
                                        <div className="h-px bg-border my-1 mx-2" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-all"
                                        >
                                            <LogOut className="size-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}

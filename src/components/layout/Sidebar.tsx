"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
    Home,
    Code2,
    Database,
    BookOpen,
    Heart,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
    Send,
    Briefcase,
    FileText,
    CalendarCheck,
    BrainCircuit,
    Sun,
    Moon,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signout } from "@/app/login/actions";

const MAIN_ITEMS = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'DSA Tracker', href: '/dsa', icon: Code2 },
    { label: 'SQL Tracker', href: '/sql', icon: Database },
    { label: 'Daily Log', href: '/daily-log', icon: BookOpen },
    { label: 'Post Lab', href: '/post-lab', icon: Send },
];

const PLACEMENT_ITEMS = [
    { label: 'Health', href: '/health', icon: Heart },
    { label: 'Placement', href: '/placement', icon: Briefcase },
    { label: 'Jobs ✦', href: '/jobs', icon: BrainCircuit },
    { label: 'Resume', href: '/resume', icon: FileText },
    { label: 'Weekly Review', href: '/weekly-review', icon: CalendarCheck },
];

const SIDEBAR_KEY = "dex-sidebar-collapsed";

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(SIDEBAR_KEY);
        if (stored === "true") setCollapsed(true);
    }, []);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem(SIDEBAR_KEY, String(next));
    };

    const cycleTheme = () => {
        if (theme === 'light') setTheme('charcoal');
        else if (theme === 'charcoal') setTheme('dark');
        else setTheme('light');
    };

    if (!mounted) {
        return (
            <aside className="fixed inset-y-0 left-0 z-30 w-[220px] bg-white dark:bg-[#0F0F0F] border-r border-gray-200 dark:border-white/[0.06] flex flex-col transition-all duration-200" />
        );
    }

    const renderNavItem = (item: { label: string; href: string; icon: any }) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
            <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                    "group relative w-full flex items-center gap-3 px-3 py-[9px] rounded-lg cursor-pointer transition-all duration-150",
                    isActive
                        ? "bg-accent/10 dark:bg-accent/15"
                        : "bg-transparent hover:bg-surface",
                    collapsed && "justify-center"
                )}
            >
                {/* Active left border */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
                )}

                <Icon
                    size={17}
                    className={cn(
                        "shrink-0 transition-colors",
                        isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary"
                    )}
                />

                {!collapsed && (
                    <span
                        className={cn(
                            "truncate transition-colors",
                            isActive
                                ? "text-[13px] font-semibold text-accent dark:text-text-primary"
                                : "text-[13px] font-medium text-text-secondary group-hover:text-text-primary"
                        )}
                    >
                        {item.label}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-30 h-screen bg-sidebar border-r border-border flex flex-col transition-all duration-200 font-inter",
                collapsed ? "w-[60px]" : "w-[220px]"
            )}
        >
            {/* Header — Premium DEX Logo */}
            <div className="h-[56px] flex items-center px-4 border-b border-border shrink-0">
                <div className={cn("flex items-center min-w-0 w-full", collapsed && "justify-center")}>
                    <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/25">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path
                                    d="M2 4L7 1L12 4V10L7 13L2 10V4Z"
                                    fill="white"
                                    fillOpacity="0.18"
                                    stroke="white"
                                    strokeWidth="1"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M7 1V13M2 4L12 10M12 4L2 10"
                                    stroke="white"
                                    strokeWidth="0.75"
                                    strokeOpacity="0.55"
                                />
                                <circle cx="7" cy="7" r="1.5" fill="white" />
                            </svg>
                        </div>
                    </div>
                    {!collapsed && (
                        <span className="ml-2.5 text-[15px] font-bold text-text-primary tracking-tight animate-fade-in truncate">
                            DEX
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-hide">
                {/* Main Items */}
                {MAIN_ITEMS.map(renderNavItem)}

                {/* Divider 1 */}
                <div className="mx-3 my-2 border-t border-border" />

                {/* Placement & Review */}
                {PLACEMENT_ITEMS.map(renderNavItem)}

                {/* Divider 2 */}
                <div className="mx-3 my-2 border-t border-border" />

                {/* Settings */}
                {renderNavItem({ label: 'Settings', href: '/settings', icon: Settings })}

                {/* Theme Toggle — inline pill at bottom of nav */}
                {!collapsed && (
                    <button
                        onClick={cycleTheme}
                        title={
                            theme === 'light'
                                ? 'Light — click for Charcoal'
                                : theme === 'charcoal'
                                    ? 'Charcoal — click for Dark'
                                    : 'Dark — click for Light'
                        }
                        className="group w-full flex items-center gap-3 px-3 py-[9px] rounded-lg cursor-pointer bg-transparent hover:bg-surface transition-all duration-150 mt-1"
                    >
                        {/* Icon */}
                        <span className="shrink-0 relative">
                            {theme === 'light' && <Sun size={17} className="text-amber-500" />}
                            {theme === 'charcoal' && (
                                <span className="relative block">
                                    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" className="text-blue-400">
                                        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M9 2 A7 7 0 0 1 9 16 Z" fill="currentColor" fillOpacity="0.65" />
                                        <circle cx="9" cy="9" r="2" fill="currentColor" />
                                    </svg>
                                    <span className="absolute -top-0.5 -right-0.5 size-1.5 bg-blue-400 rounded-full animate-pulse" />
                                </span>
                            )}
                            {theme === 'dark' && <Moon size={17} className="text-indigo-400" />}
                        </span>
                        {/* Label */}
                        <span className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate">
                            {theme === 'light' ? 'Light Mode' : theme === 'charcoal' ? 'Charcoal Mode' : 'Dark Mode'}
                        </span>
                    </button>
                )}
                {collapsed && (
                    <button
                        onClick={cycleTheme}
                        className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-surface transition-colors mt-1"
                        title={theme === 'light' ? 'Switch to Charcoal' : theme === 'charcoal' ? 'Switch to Dark' : 'Switch to Light'}
                    >
                        {theme === 'light' && <Sun size={16} className="text-amber-500" />}
                        {theme === 'charcoal' && (
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="text-blue-400">
                                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M9 2 A7 7 0 0 1 9 16 Z" fill="currentColor" fillOpacity="0.65" />
                                <circle cx="9" cy="9" r="2" fill="currentColor" />
                            </svg>
                        )}
                        {theme === 'dark' && <Moon size={16} className="text-indigo-400" />}
                    </button>
                )}
            </nav>

            {/* Bottom Collapse Toggle & Logout */}
            <div className="border-t border-border p-3 shrink-0 flex flex-col gap-1">
                <button
                    onClick={toggle}
                    className="w-full flex items-center justify-center py-2 gap-2 cursor-pointer text-text-secondary hover:text-text-primary transition-colors rounded hover:bg-surface"
                >
                    {collapsed ? (
                        <PanelLeftOpen size={16} />
                    ) : (
                        <>
                            <PanelLeftClose size={16} />
                            <span className="text-[12px] font-medium animate-fade-in">Collapse Menu</span>
                        </>
                    )}
                </button>

                <form action={signout} className="w-full">
                    <button
                        type="submit"
                        title={collapsed ? "Secure Logout" : undefined}
                        className="w-full flex items-center justify-center py-2 gap-2 cursor-pointer text-error/70 hover:text-error transition-colors rounded hover:bg-error/10"
                    >
                        {collapsed ? (
                            <LogOut size={16} className="-ml-0.5" />
                        ) : (
                            <>
                                <LogOut size={16} className="-ml-1" />
                                <span className="text-[12px] font-medium animate-fade-in">Secure Logout</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </aside>
    );
}

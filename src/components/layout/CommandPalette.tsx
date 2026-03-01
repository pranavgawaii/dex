"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
    Home, Code2, Database, BookOpen, Send,
    Heart, Briefcase, FileText, CalendarCheck, Settings,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGES = [
    { label: 'Home Dashboard', href: '/', icon: Home, shortcuts: ['h'] },
    { label: 'DSA Tracker', href: '/dsa', icon: Code2, shortcuts: ['d', 's', 'a'] },
    { label: 'SQL Tracker', href: '/sql', icon: Database, shortcuts: ['s', 'q', 'l'] },
    { label: 'Daily Log', href: '/daily-log', icon: BookOpen, shortcuts: ['l', 'o', 'g'] },
    { label: 'Post Lab', href: '/post-lab', icon: Send, shortcuts: ['p', 'o', 's', 't'] },
    { label: 'Health & Fitness', href: '/health', icon: Heart, shortcuts: ['h', 'e', 'a'] },
    { label: 'Placement Tracker', href: '/placement', icon: Briefcase, shortcuts: ['j', 'o', 'b'] },
    { label: 'Resume AI', href: '/resume', icon: FileText, shortcuts: ['r', 'e', 's'] },
    { label: 'Weekly Review', href: '/weekly-review', icon: CalendarCheck, shortcuts: ['w', 'e', 'e', 'k'] },
    { label: 'Settings', href: '/settings', icon: Settings, shortcuts: ['s', 'e', 't'] },
];

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleSelect = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            <Command
                className={cn(
                    "relative w-full max-w-[600px] overflow-hidden rounded-xl",
                    "bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 shadow-2xl",
                    "animate-in fade-in zoom-in-95 duration-200"
                )}
                shouldFilter={true}
            >
                <div className="flex items-center border-b border-gray-200 dark:border-white/10 px-3">
                    <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-gray-500 dark:text-gray-400" />
                    <Command.Input
                        autoFocus
                        placeholder="Type a command or search..."
                        className={cn(
                            "flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none",
                            "text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        )}
                    />
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.05] px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        ESC
                    </kbd>
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 scrollbar-hide">
                    <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Navigation" className="text-xs font-medium text-gray-500 dark:text-gray-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                        {PAGES.map((page) => (
                            <Command.Item
                                key={page.href}
                                value={`${page.label} ${page.shortcuts.join(" ")}`}
                                onSelect={() => handleSelect(page.href)}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm cursor-pointer transition-colors",
                                    "text-gray-700 dark:text-gray-200",
                                    "aria-selected:bg-blue-50 aria-selected:text-blue-700",
                                    "dark:aria-selected:bg-blue-500/10 dark:aria-selected:text-blue-400"
                                )}
                            >
                                <page.icon className="h-4 w-4" />
                                <span>{page.label}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
}

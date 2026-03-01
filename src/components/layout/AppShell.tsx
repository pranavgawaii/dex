"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

import { CommandPalette } from "./CommandPalette";

const Navi = dynamic(() => import("@/components/mascot/Navi"), { ssr: false });

const SIDEBAR_KEY = "dex-sidebar-collapsed";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(SIDEBAR_KEY);
        if (stored === "true") setCollapsed(true);

        // Listen for storage changes from sidebar
        const handleStorage = () => {
            const val = localStorage.getItem(SIDEBAR_KEY);
            setCollapsed(val === "true");
        };

        // Use a MutationObserver-like approach: poll localStorage
        const interval = setInterval(handleStorage, 200);
        window.addEventListener("storage", handleStorage);

        return () => {
            clearInterval(interval);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    if (pathname === '/login') {
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    return (
        <div className="h-screen w-full flex overflow-hidden bg-background">
            <Sidebar />
            <div
                className={cn(
                    "flex-1 flex flex-col h-full transition-all duration-300 ease-in-out",
                    mounted ? (collapsed ? "ml-[60px]" : "ml-[220px]") : "ml-[220px]"
                )}
            >
                <TopBar />
                <CommandPalette />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
            <Navi />
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, SendHorizontal, Search, Bot, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
    id: string;
    text: string;
    sender: "navi" | "user";
};

export default function Navi() {
    const pathname = usePathname() || "/";
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [unread, setUnread] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const greetedRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-scroll to bottom inside the chat container
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Cleanup idle timeout if user opens chat manually
    useEffect(() => {
        if (isOpen && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [isOpen]);

    // Initial greeting on mount
    useEffect(() => {
        if (greetedRef.current) return;
        greetedRef.current = true;

        const timer = setTimeout(() => {
            const hour = new Date().getHours();
            let msg = "Hey Pranav! Need anything? I'm right here.";

            if (pathname === "/") {
                if (hour >= 5 && hour < 12) msg = "Good morning Pranav! Ready to crush today?";
                else if (hour >= 12 && hour < 17) msg = "Afternoon! Streak still alive? 🔥";
                else if (hour >= 17 && hour < 21) msg = "Evening! Don't forget your daily log.";
                else msg = "Still grinding? Log your day before sleep!";
            } else if (pathname.startsWith("/dsa")) {
                msg = "Let's solve some problems! What pattern today?";
            } else if (pathname.startsWith("/sql")) {
                msg = "SQL time! Window functions = placement round winner.";
            } else if (pathname === "/daily-log") {
                msg = "Time to reflect. What did you learn today?";
            } else if (pathname === "/goals") {
                const daysLeft = Math.ceil((new Date("2026-08-31").getTime() - new Date().getTime()) / 86400000);
                msg = `You have ${daysLeft} days to your first offer. Stay focused!`;
            }

            setMessages([{ id: "msg_init", text: msg, sender: "navi" }]);
            setIsOpen(true);

            // Auto-close after 5s unless interrupted
            timeoutRef.current = setTimeout(() => {
                setIsOpen(false);
                setUnread(true); // they didn't interact, mark as unread if they want to read it later
            }, 5000);

        }, 800);

        return () => clearTimeout(timer);
    }, [pathname]);

    // Quick chips based on pathname
    const CHIPS_MAP: Record<string, string[]> = {
        "/": ["How am I doing?", "Today's plan", "Motivate me"],
        "/dsa": ["What to solve next?", "Weakest pattern?", "Quick tip"],
        "/sql": ["What to practice?", "Explain window functions", "SQL tip"],
        "/daily-log": ["Generate my post", "Summarize my day"],
        "/goals": ["Am I on track?", "What to focus on?"],
        "/projects": ["Project feedback", "What to build next?"],
    };
    const currentChips = CHIPS_MAP[pathname] || ["Help", "Motivate me", "Quick tip"];

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const newMsg: Message = { id: Date.now().toString(), text, sender: "user" };
        setMessages((prev) => [...prev, newMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/navi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history: messages,
                    page: pathname
                }),
            });
            const data = await res.json();
            if (data.reply) {
                setMessages((prev) => [...prev, { id: Date.now().toString() + "_navi", text: data.reply, sender: "navi" }]);

                // Track usage globally
                const stored = localStorage.getItem('dex_gemini_usage');
                const today = new Date().toISOString().split('T')[0];
                let count = 0;
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.date === today) count = parsed.count;
                }
                const newCount = count + 1;
                localStorage.setItem('dex_gemini_usage', JSON.stringify({ count: newCount, date: today }));
                window.dispatchEvent(new Event('storage'));
            } else {
                setMessages((prev) => [...prev, { id: Date.now().toString() + "_err", text: "I glitched out for a second. Try again?", sender: "navi" }]);
            }
        } catch (error) {
            console.error("Navi Chat Error:", error);
            setMessages((prev) => [...prev, { id: Date.now().toString() + "_err2", text: "Network error. Make sure your GEMINI_KEY is valid.", sender: "navi" }]);
        } finally {
            setLoading(false);
            if (!isOpen) setUnread(true);
        }
    };

    const toggleOpen = () => {
        if (!isOpen) {
            setUnread(false);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 8 }}
                        transition={{ type: "spring", stiffness: 380, damping: 24 }}
                        style={{ transformOrigin: "bottom right" }}
                        className="absolute bottom-20 right-0 w-72 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-2xl rounded-br-none shadow-xl shadow-black/10 dark:shadow-black/50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1F1F1F] flex items-center justify-between bg-white dark:bg-[#0D0D0D]">
                            <div className="flex items-center gap-2.5">
                                <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">DEX Intelligence</span>
                                    <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">Live Support</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 dark:text-[#71717A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-all"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="px-4 py-4 min-h-[100px] max-h-[260px] overflow-y-auto flex flex-col gap-3 custom-scrollbar bg-white dark:bg-[#0D0D0D]">
                            {messages.map((m) => (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                        "px-4 py-2.5 text-[11px] font-medium leading-relaxed max-w-[90%] transition-all",
                                        m.sender === "navi"
                                            ? "bg-gray-50 dark:bg-[#141414] text-gray-700 dark:text-[#D4D4D8] rounded-2xl rounded-tl-sm self-start border border-gray-100 dark:border-[#1F1F1F]"
                                            : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl rounded-tr-sm self-end font-bold shadow-lg shadow-black/5"
                                    )}
                                >
                                    {m.text}
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gray-50 dark:bg-[#141414] text-gray-800 dark:text-[#E5E7EB] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] self-start border border-gray-100 dark:border-[#1F1F1F]"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-1.5 rounded-full bg-gray-400 dark:bg-[#3F3F46] animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="size-1.5 rounded-full bg-gray-400 dark:bg-[#3F3F46] animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="size-1.5 rounded-full bg-gray-400 dark:bg-[#3F3F46] animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Chips */}
                        <div className="px-4 pb-3 flex flex-wrap gap-1.5 bg-white dark:bg-[#0D0D0D]">
                            {currentChips.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(chip)}
                                    className="border border-gray-100 dark:border-[#1F1F1F] text-[10px] font-bold text-gray-500 dark:text-[#71717A] uppercase tracking-wider rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#161616] hover:text-gray-900 dark:hover:text-white hover:border-gray-200 dark:hover:border-[#3F3F46] transition-all duration-150"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="px-4 pb-4 bg-white dark:bg-[#0D0D0D] flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                                placeholder="Command DEX..."
                                className="flex-1 bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-[#1F1F1F] rounded-xl px-4 py-2.5 text-[11px] font-semibold text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#3F3F46] focus:outline-none focus:border-gray-300 dark:focus:border-[#3F3F46] transition-all"
                            />
                            <button
                                onClick={() => handleSend(input)}
                                disabled={!input.trim()}
                                className="size-10 shrink-0 rounded-xl bg-gray-900 dark:bg-white hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center text-white dark:text-gray-900 disabled:opacity-50 transition-all shadow-lg shadow-black/10"
                            >
                                <SendHorizontal className="size-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div className="relative">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleOpen}
                    className={cn(
                        "size-14 rounded-full flex items-center justify-center cursor-pointer shadow-2xl relative transition-all duration-300",
                        isOpen
                            ? "bg-gray-900 dark:bg-white"
                            : "bg-white dark:bg-[#0D0D0D] border border-gray-100 dark:border-[#1F1F1F]"
                    )}
                >
                    {isOpen ? (
                        <X className="size-6 text-white dark:text-gray-900" />
                    ) : (
                        <div className="relative">
                            <Bot className="size-6 text-gray-900 dark:text-white" />
                            <div className="absolute -top-1 -right-1 size-2 rounded-full bg-blue-500 border border-white dark:border-[#0D0D0D]" />
                        </div>
                    )}

                    {!isOpen && unread && (
                        <div className="absolute -top-1 -right-1 z-50 size-4 rounded-full bg-red-500 border-4 border-white dark:border-[#080808] animate-bounce" />
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}

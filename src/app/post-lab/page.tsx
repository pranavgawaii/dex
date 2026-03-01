"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Send, Copy, Check, RefreshCw, BarChart2, Calendar, Zap, Twitter, Linkedin, Loader2, Sparkles, Image as ImageIcon, Clock, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { savePostAnalytics, getPostAnalytics, PostAnalytics } from "@/lib/supabase/queries";

const PILLARS = ["Builder 🔨", "Relatable 😄", "Opinion 🔥", "Learning 📚", "Personal Brand 🧠"];

// Define types local to the component to match API response
interface XCaption {
    text: string;
    tone: string;
    time: string;
    hashtag: string;
}

interface LinkedInPost {
    text: string;
    time: string;
    wordCount: number;
}

interface WeeklyPlanDay {
    day: string;
    xCaption: string;
    linkedinPost: string;
    pillar: string;
    posted: boolean;
}

function PostLabContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState("daily");
    const [inputPlatform, setInputPlatform] = useState<'x' | 'linkedin'>('x');

    // --- Tab 1: Daily Captions State ---
    const [activity, setActivity] = useState("");
    const [selectedPillar, setSelectedPillar] = useState(PILLARS[0]);
    const [platforms, setPlatforms] = useState<string[]>(['x', 'linkedin']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showDraftBanner, setShowDraftBanner] = useState(false);

    const [xCaptions, setXCaptions] = useState<XCaption[] | null>(null);
    const [liPost, setLiPost] = useState<LinkedInPost | null>(null);

    const [copiedIndex, setCopiedIndex] = useState<number | string | null>(null);

    // --- Tab 2: Weekly Planner State ---
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanDay[] | null>(null);
    const [isGeneratingWeek, setIsGeneratingWeek] = useState(false);

    // --- Tab 3: Analytics State ---
    const [analytics, setAnalytics] = useState<PostAnalytics[]>([]);
    const [logPlatform, setLogPlatform] = useState<'x' | 'linkedin'>('x');
    const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
    const [logCaption, setLogCaption] = useState("");
    const [logPillar, setLogPillar] = useState(PILLARS[0]);
    const [logLikes, setLogLikes] = useState(0);
    const [logComments, setLogComments] = useState(0);
    const [logReposts, setLogReposts] = useState(0);
    const [logImpressions, setLogImpressions] = useState(0);
    const [isLogging, setIsLogging] = useState(false);

    // FEATURE A: Draft Pre-fill
    useEffect(() => {
        const draftMode = searchParams.get('draft');
        const platformParam = searchParams.get('platform');

        if (draftMode === 'true' && platformParam) {
            const storedDraft = localStorage.getItem(`dex_draft_${platformParam}`);
            if (storedDraft) {
                setActivity(storedDraft);
                setInputPlatform(platformParam as 'x' | 'linkedin');
                setPlatforms([platformParam]);
                setShowDraftBanner(true);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (activeTab === "analytics") {
            loadAnalytics();
        }
    }, [activeTab]);

    const loadAnalytics = async () => {
        const data = await getPostAnalytics();
        setAnalytics(data);
    };

    const handleCopy = (text: string, index: number | string) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleGenerateDaily = async () => {
        if (!activity.trim()) {
            return;
        }
        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate-captions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity,
                    pillar: selectedPillar,
                    platforms: [inputPlatform],
                    mode: 'daily'
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (inputPlatform === 'x') {
                setXCaptions(data.xCaptions || null);
            } else {
                setLiPost(data.linkedinPost || null);
            }
            setPlatforms([inputPlatform]); // Update output platforms to match input
        } catch (error: any) {
            console.error("Generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateWeek = async () => {
        setIsGeneratingWeek(true);
        try {
            const res = await fetch('/api/generate-captions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'week' })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const planWithPosted = (data.plan || []).map((d: any) => ({ ...d, posted: false }));
            setWeeklyPlan(planWithPosted);
        } catch (error: any) {
            console.error("Week plan generation failed:", error);
        } finally {
            setIsGeneratingWeek(false);
        }
    };

    const handleLogPerformance = async () => {
        setIsLogging(true);
        try {
            await savePostAnalytics({
                platform: logPlatform as 'x' | 'linkedin',
                pillar: logPillar,
                posted_date: logDate,
                caption_text: logCaption,
                likes: logLikes,
                comments: logComments,
                reposts: logReposts,
                impressions: logImpressions,
            });

            // Reset numerical forms
            setLogLikes(0);
            setLogComments(0);
            setLogReposts(0);
            setLogImpressions(0);
            setLogCaption("");

            await loadAnalytics();
        } finally {
            setIsLogging(false);
        }
    };

    // Best time logic
    const isNowBestTimeX = () => {
        const hour = new Date().getHours();
        return hour >= 19 && hour <= 21; // 7-9 PM
    };
    const isNowBestTimeLi = () => {
        const hour = new Date().getHours();
        return hour >= 8 && hour <= 10; // 8-10 AM
    };

    // Stats calculations for Analytics Tab
    const totalPosts = analytics.length;
    const avgEngagement = analytics.length > 0
        ? (analytics.reduce((acc, curr) => acc + (curr.impressions > 0 ? (curr.likes + curr.comments) / curr.impressions : 0), 0) / analytics.length) * 100
        : 0;

    let bestPillar = "-";
    let bestDay = "-";
    if (analytics.length > 0) {
        const pillarMap: Record<string, number> = {};
        const dayMap: Record<number, number> = {};
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        analytics.forEach(a => {
            const eng = a.likes + a.comments;
            pillarMap[a.pillar] = (pillarMap[a.pillar] || 0) + eng;

            const dayNum = new Date(a.posted_date).getDay();
            dayMap[dayNum] = (dayMap[dayNum] || 0) + eng;
        });

        bestPillar = Object.keys(pillarMap).reduce((a, b) => pillarMap[a] > pillarMap[b] ? a : b);
        const bestDNum = Object.keys(dayMap).map(Number).reduce((a, b) => dayMap[a] > dayMap[b] ? a : b);
        bestDay = dayNames[bestDNum];
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in pb-12">

            {/* FEATURE A: Draft Banner */}
            {showDraftBanner && (
                <div className="bg-blue-50 dark:bg-[#0D0D12] border-l-4 border-l-blue-600 dark:border-l-[#7C3AED] px-4 py-3 text-sm rounded-r-lg mb-4 flex justify-between items-center text-blue-700 dark:text-blue-400">
                    <span className="flex items-center gap-2">
                        <Sparkles size={16} />
                        Suggestion loaded from your notifications. Edit and post when ready.
                    </span>
                    <button onClick={() => setShowDraftBanner(false)} className="hover:opacity-70 transition-opacity">
                        <XIcon size={16} />
                    </button>
                </div>
            )}

            {/* PAGE HEADER */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                        <Send size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight font-geist">
                            Post Lab
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            AI-generated captions for X and LinkedIn
                        </p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 p-1 rounded-xl flex max-w-[400px]">
                    <TabsTrigger value="daily" className="flex-1 rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:shadow-sm transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-50">
                        <Send className="w-4 h-4 mr-2" /> Daily Captions
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className="flex-1 rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:shadow-sm transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-50">
                        <Calendar className="w-4 h-4 mr-2" /> Weekly Planner
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex-1 rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:shadow-sm transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-50">
                        <BarChart2 className="w-4 h-4 mr-2" /> Analytics
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    {/* TAB 1: DAILY CAPTIONS */}
                    <TabsContent value="daily" className="m-0 space-y-6">

                        {/* FEATURE B: Platform Tabs for Input */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setInputPlatform('x')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border",
                                    inputPlatform === 'x'
                                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-md"
                                        : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                )}
                            >
                                <span className="text-sm font-bold">𝕏</span> Post for X
                            </button>
                            <button
                                onClick={() => setInputPlatform('linkedin')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border",
                                    inputPlatform === 'linkedin'
                                        ? "bg-blue-600 text-white border-transparent shadow-md"
                                        : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                )}
                            >
                                <Linkedin size={16} /> Post for LinkedIn
                            </button>
                        </div>

                        {/* INPUT CARD */}
                        <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    {inputPlatform === 'x' ? "What's happening on X?" : "Insight for LinkedIn"}
                                </h3>

                                <div className="relative">
                                    <Textarea
                                        value={activity}
                                        onChange={(e) => setActivity(e.target.value)}
                                        placeholder={inputPlatform === 'x' ? "e.g. Just solved Trapping Rain Water! The two-pointer trick..." : "Share a professional win or a reflection on your learning journey..."}
                                        className="resize-none h-32 bg-white dark:bg-black border-gray-200 dark:border-gray-800 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500 mb-2"
                                        maxLength={inputPlatform === 'x' ? 280 : 400}
                                    />
                                    {/* Char Counter */}
                                    <div className={cn(
                                        "absolute bottom-4 right-4 text-[10px] font-bold px-1.5 py-0.5 rounded",
                                        inputPlatform === 'x'
                                            ? (activity.length > 270 ? "text-red-500 bg-red-500/10" : activity.length > 240 ? "text-amber-500 bg-amber-500/10" : "text-green-500 bg-green-500/10")
                                            : (activity.length > 380 ? "text-red-500 bg-red-500/10" : "text-blue-500 bg-blue-500/10")
                                    )}>
                                        {activity.length} / {inputPlatform === 'x' ? 280 : 400}
                                    </div>
                                </div>

                                {inputPlatform === 'linkedin' && (
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-6 italic opacity-80">
                                        LinkedIn tip: Start with a hook. End with a question.
                                    </p>
                                )}

                                {/* Best Time Banner */}
                                <div className="flex items-center gap-2 mb-6">
                                    <Clock className="size-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-500 dark:text-[#71717A]">
                                        Best to post on X: 7–9 PM IST · Best for LinkedIn: 8–10 AM IST
                                    </span>
                                    {(inputPlatform === 'x' && isNowBestTimeX()) || (inputPlatform === 'linkedin' && isNowBestTimeLi()) ? (
                                        <span className="text-green-600 dark:text-green-400 text-xs font-bold animate-pulse ml-2 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                            Now is a great time to post!
                                        </span>
                                    ) : null}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Content Pillar</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {PILLARS.map(pillar => (
                                                <button
                                                    key={pillar}
                                                    onClick={() => setSelectedPillar(pillar)}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border dark:border-none",
                                                        selectedPillar === pillar
                                                            ? "bg-blue-600 text-white border-transparent"
                                                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    )}
                                                >
                                                    {pillar}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        disabled={isGenerating || !activity.trim()}
                                        onClick={handleGenerateDaily}
                                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-6 rounded-xl transition-all shadow-md mt-4"
                                    >
                                        {isGenerating ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Captions...</>
                                        ) : (
                                            <><Sparkles className="mr-2 h-5 w-5" /> Enhance with AI ✨</>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* EMPTY STATE */}
                        {!xCaptions && !liPost && !isGenerating && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="py-20 flex flex-col items-center justify-center text-center opacity-70"
                            >
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                                    <ImageIcon size={32} />
                                </div>
                                <h3 className="text-gray-500 dark:text-gray-400 font-medium">Describe your day and generate captions ✨</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">DEX will create variations based on Pranav's personal brand.</p>
                            </motion.div>
                        )}

                        {/* OUTPUTS */}
                        <AnimatePresence>
                            {platforms.includes('x') && xCaptions && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-800"
                                >
                                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                        <Twitter size={20} className="text-blue-500" /> X (Twitter)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {xCaptions.map((cap, i) => {
                                            const chars = cap.text.length;
                                            const isOver = chars > 280;
                                            const isWarning = chars > 240 && !isOver;

                                            const hashParts = cap.hashtag ? cap.hashtag.split(',').map(h => h.trim().startsWith('#') ? h : `#${h.trim()}`) : [];
                                            const safeHashtagStr = hashParts.length > 0 ? `\n\n${hashParts.join(' ')}` : '';
                                            const fullText = cap.text.includes(cap.hashtag) ? cap.text : `${cap.text}${safeHashtagStr}`;
                                            const copyFullText = fullText.substring(0, 280);

                                            return (
                                                <Card key={i} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 flex flex-col shadow-sm">
                                                    <CardContent className="p-5 flex flex-col h-full">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-medium border-0 px-2 py-0.5">{cap.tone}</Badge>
                                                            <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-medium border-0 px-2 py-0.5">{cap.time}</Badge>
                                                        </div>

                                                        <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap flex-1 leading-relaxed">
                                                            {cap.text}
                                                            {hashParts.length > 0 && !cap.text.includes(hashParts[0]) && (
                                                                <span className="text-blue-500 dark:text-blue-400 block mt-2">{hashParts.join(' ')}</span>
                                                            )}
                                                        </p>

                                                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                                                            <div className={cn(
                                                                "text-[11px] font-medium",
                                                                isOver ? "text-red-500" : isWarning ? "text-amber-500" : "text-green-500 dark:text-green-400"
                                                            )}>
                                                                {copyFullText.length}/280
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleGenerateDaily()} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                                                                    <RefreshCw size={14} />
                                                                </button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white transition-colors"
                                                                    onClick={() => handleCopy(copyFullText, `x-${i}`)}
                                                                >
                                                                    {copiedIndex === `x-${i}` ? <><Check size={12} className="mr-1.5" /> Copied ✓</> : <><Copy size={12} className="mr-1.5" /> Copy</>}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {platforms.includes('linkedin') && liPost && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="space-y-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-800"
                                >
                                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                        <Linkedin size={20} className="text-[#0077b5] dark:text-[#0a66c2]" /> LinkedIn
                                    </h3>

                                    <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-medium border-0">{liPost.time || "Post at 9 AM IST on weekdays"}</Badge>
                                                <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-medium border-0">{liPost.wordCount || liPost.text.split(' ').length} words</Badge>
                                            </div>

                                            <p className="text-gray-800 dark:text-gray-200 text-[15px] whitespace-pre-wrap leading-relaxed max-w-3xl">
                                                {liPost.text}
                                            </p>

                                            <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800" onClick={handleGenerateDaily}>
                                                    <RefreshCw size={14} className="mr-2" /> Regenerate ↺
                                                </Button>
                                                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:text-white transition-colors" onClick={() => handleCopy(liPost.text, 'li')}>
                                                    {copiedIndex === 'li' ? <><Check size={14} className="mr-2" /> Copied ✓</> : <><Copy size={14} className="mr-2" /> Copy to Clipboard</>}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </TabsContent>

                    {/* TAB 2: WEEKLY PLANNER */}
                    <TabsContent value="weekly" className="m-0 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Content Plan</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Your 7-day posting calendar</p>
                            </div>
                            <Button onClick={handleGenerateWeek} disabled={isGeneratingWeek} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">
                                {isGeneratingWeek ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Generate Week
                            </Button>
                        </div>

                        {!weeklyPlan && !isGeneratingWeek ? (
                            <div className="py-24 flex flex-col items-center justify-center text-center opacity-70 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-dashed rounded-xl">
                                <Calendar size={40} className="text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-gray-500 dark:text-gray-400 font-medium">Click Generate Week to plan your content 📅</h3>
                            </div>
                        ) : (
                            isGeneratingWeek ? (
                                <div className="py-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                                    <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">Planning your week...</p>
                                </div>
                            ) : weeklyPlan && (
                                <div className="space-y-3">
                                    {weeklyPlan.map((dayPlan, i) => (
                                        <Card key={i} className={cn("bg-white dark:bg-black border border-gray-200 dark:border-gray-800 transition-colors", dayPlan.posted && "border-green-200 dark:border-green-800/50 bg-green-50/30 dark:bg-green-900/10")}>
                                            <div className="flex flex-col md:flex-row">
                                                <div className="md:w-20 shrink-0 p-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
                                                    <span className={cn("font-bold text-sm tracking-wider", dayPlan.posted ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400")}>{dayPlan.day}</span>
                                                </div>
                                                <div className="flex-1 p-0">
                                                    {dayPlan.xCaption && (
                                                        <div className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                            <div className="text-blue-500 shrink-0"><Twitter size={18} /></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Badge className="text-[10px] font-medium bg-white dark:bg-gray-800 dark:border-gray-700">{dayPlan.pillar}</Badge>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-500">8 PM IST</span>
                                                                </div>
                                                                <p className={cn("text-sm truncate pr-4 transition-colors", dayPlan.posted ? "text-gray-400 dark:text-gray-600 line-through" : "text-gray-800 dark:text-gray-200")}>{dayPlan.xCaption}</p>
                                                            </div>
                                                            <div className="shrink-0 flex items-center gap-2">
                                                                <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500 max-sm:hidden dark:text-gray-400" onClick={() => handleCopy(dayPlan.xCaption, `x-w-${i}`)}>
                                                                    {copiedIndex === `x-w-${i}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {dayPlan.xCaption && dayPlan.linkedinPost && <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />}
                                                    {dayPlan.linkedinPost && (
                                                        <div className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                            <div className="text-[#0a66c2] shrink-0"><Linkedin size={18} /></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Badge className="text-[10px] font-medium bg-white dark:bg-gray-800 dark:border-gray-700">{dayPlan.pillar}</Badge>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-500">9 AM IST</span>
                                                                </div>
                                                                <p className={cn("text-sm truncate pr-4 transition-colors", dayPlan.posted ? "text-gray-400 dark:text-gray-600 line-through" : "text-gray-800 dark:text-gray-200")}>{dayPlan.linkedinPost}</p>
                                                            </div>
                                                            <div className="shrink-0 flex items-center gap-2">
                                                                <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500 max-sm:hidden dark:text-gray-400" onClick={() => handleCopy(dayPlan.linkedinPost, `li-w-${i}`)}>
                                                                    {copiedIndex === `li-w-${i}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="md:w-[120px] shrink-0 p-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 flex items-center justify-center md:flex-col gap-2">
                                                    <Button variant={dayPlan.posted ? "outline" : "default"} className={cn("w-full h-8 text-xs", dayPlan.posted ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-500 bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700")} onClick={() => { const n = [...weeklyPlan]; n[i].posted = !n[i].posted; setWeeklyPlan(n); }}>
                                                        {dayPlan.posted ? <><Check size={14} className="mr-1.5" /> Posted</> : "Mark done"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    <div className="pt-6 pb-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Posted {weeklyPlan.filter(p => p.posted).length} days this week</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${(weeklyPlan.filter(p => p.posted).length / 7) * 100}%` }} />
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" onClick={handleGenerateWeek}>
                                        <RefreshCw size={14} className="mr-2" /> Regenerate Full Week
                                    </Button>
                                </div>
                            )
                        )}
                    </TabsContent>

                    {/* TAB 3: ANALYTICS */}
                    <TabsContent value="analytics" className="m-0 space-y-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Post Performance</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Log your post stats. DEX learns what works for you.</p>
                        </div>

                        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm">
                            <CardContent className="p-5">
                                <form onSubmit={(e) => { e.preventDefault(); handleLogPerformance(); }} className="space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex space-x-2 shrink-0 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 h-10 w-fit">
                                            <button type="button" onClick={() => setLogPlatform('x')} className={cn("px-3 py-1 flex items-center text-sm font-medium rounded-md transition-all", logPlatform === 'x' ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                                                <Twitter size={14} className="mr-2" /> X
                                            </button>
                                            <button type="button" onClick={() => setLogPlatform('linkedin')} className={cn("px-3 py-1 flex items-center text-sm font-medium rounded-md transition-all", logPlatform === 'linkedin' ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                                                <Linkedin size={14} className="mr-2" /> LinkedIn
                                            </button>
                                        </div>
                                        <div className="flex-[0.5]">
                                            <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="dark:bg-gray-900 dark:border-gray-800" required />
                                        </div>
                                        <div className="flex-1">
                                            <select value={logPillar} onChange={e => setLogPillar(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border bg-transparent font-medium rounded-md appearance-none border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50">
                                                {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <Textarea placeholder="Optional preview snippet..." value={logCaption} onChange={e => setLogCaption(e.target.value)} className="h-10 min-h-[40px] py-2 dark:bg-gray-900 dark:border-gray-800" />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end border-t border-gray-100 dark:border-gray-800/50 pt-4 mt-2">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Likes</label>
                                            <Input type="number" min="0" value={logLikes} onChange={e => setLogLikes(parseInt(e.target.value) || 0)} className="h-9 dark:bg-gray-900 dark:border-gray-800 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Comments</label>
                                            <Input type="number" min="0" value={logComments} onChange={e => setLogComments(parseInt(e.target.value) || 0)} className="h-9 dark:bg-gray-900 dark:border-gray-800 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Reposts</label>
                                            <Input type="number" min="0" value={logReposts} onChange={e => setLogReposts(parseInt(e.target.value) || 0)} className="h-9 dark:bg-gray-900 dark:border-gray-800 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Impressions</label>
                                            <Input type="number" min="0" value={logImpressions} onChange={e => setLogImpressions(parseInt(e.target.value) || 0)} className="h-9 dark:bg-gray-900 dark:border-gray-800 text-sm" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1 pt-1.5">
                                            <Button type="submit" disabled={isLogging} className="w-full h-9 bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200">
                                                {isLogging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Save
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"><CardContent className="p-4"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Posts</p><p className="text-2xl font-bold dark:text-white">{totalPosts}</p></CardContent></Card>
                            <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"><CardContent className="p-4"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avg Engagement</p><p className="text-2xl font-bold dark:text-white">{avgEngagement.toFixed(1)}%</p></CardContent></Card>
                            <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"><CardContent className="p-4"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Best Pillar</p><p className="text-xl font-bold dark:text-white truncate">{bestPillar.split(' ')[0]}</p></CardContent></Card>
                            <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"><CardContent className="p-4"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Best Day</p><p className="text-xl font-bold dark:text-white truncate">{bestDay}</p></CardContent></Card>
                        </div>

                        <Card className="bg-blue-50/50 dark:bg-[#0D0D12] border-blue-100 dark:border-blue-900/30 overflow-hidden relative">
                            <CardContent className="p-6">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Sparkles size={80} className="text-blue-500 -rotate-12 translate-x-4 -translate-y-4" /></div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 relative z-10 text-sm"><Sparkles size={18} className="text-blue-600 dark:text-blue-400" /> DEX Insights 🧠</h3>
                                <div className="relative z-10">
                                    {analytics.length < 5 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Log at least 5 posts to unlock AI insights ✨</p>
                                    ) : (
                                        <ul className="space-y-3">
                                            <li className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"><div className="min-w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />Your {bestPillar} posts consistently drive higher than average replies.</li>
                                            <li className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"><div className="min-w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />Impressions peak on {bestDay}s based on your logged history.</li>
                                            <li className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"><div className="min-w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />Keep your X captions punchy. Short formats performed better last week.</li>
                                        </ul>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {analytics.length > 0 && (
                            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-black overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">Date</th>
                                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">Platform</th>
                                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">Pillar</th>
                                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 text-right">Likes</th>
                                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 text-right">Cmnts</th>
                                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 text-right">Imps</th>
                                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 text-right">Eng. Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                                        {analytics.slice(0, 30).map((a, i) => {
                                            const engRate = a.impressions > 0 ? ((a.likes + a.comments) / a.impressions) * 100 : 0;
                                            return (
                                                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                                    <td className="px-5 py-3 text-gray-900 dark:text-gray-300 font-medium whitespace-nowrap">{a.posted_date}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <div className={cn("inline-flex items-center justify-center p-1 rounded", a.platform === 'x' ? "bg-gray-100 dark:bg-gray-800" : "bg-blue-50 dark:bg-[#0a66c2]/20 text-[#0a66c2] dark:text-[#70b5f9]")}>
                                                            {a.platform === 'x' ? <Twitter size={14} /> : <Linkedin size={14} />}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap"><Badge className="text-[10px] bg-white dark:bg-gray-900 dark:border-gray-700">{a.pillar.split(' ')[0]}</Badge></td>
                                                    <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{a.likes}</td>
                                                    <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{a.comments}</td>
                                                    <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{a.impressions.toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-right">
                                                        <span className={cn("font-medium text-xs rounded px-2 py-0.5", engRate > 5 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : engRate > 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                                                            {engRate.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

export default function PostLabPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="animate-spin text-blue-500 size-8" />
            </div>
        }>
            <PostLabContent />
        </Suspense>
    );
}

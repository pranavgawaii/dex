"use client";

import { useState } from "react";
import { Check, CheckCircle2, Bookmark, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Integrate actual database structure for courses and resources later

const CERTS = [
    {
        title: "AWS Cloud Practitioner",
        provider: "AWS",
        providerColor: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
        status: "In Progress",
        statusColor: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        progress: 40,
        target: "March 2026",
    },
    {
        title: "Google Cloud Digital Leader",
        provider: "Google",
        providerColor: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500",
        status: "Todo",
        statusColor: "bg-gray-50 text-gray-500 dark:bg-[#1F1F1F] dark:text-[#71717A] border-gray-200 dark:border-[#3F3F46]",
        progress: 0,
        target: "April 2026",
    },
    {
        title: "Meta Front-End Developer",
        provider: "Meta",
        providerColor: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500",
        status: "Done ✓",
        statusColor: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/40",
        progress: 100,
        earned: "Dec 2025",
    },
    {
        title: "IBM AI Engineer",
        provider: "IBM",
        providerColor: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500",
        status: "In Progress",
        statusColor: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        progress: 60,
        target: "May 2026",
    }
];

const CS_VARS = [
    {
        title: "OOP",
        topics: [
            { text: "Classes & Objects", done: true },
            { text: "Inheritance", done: true },
            { text: "Polymorphism", done: true },
            { text: "Abstraction", done: true },
            { text: "Encapsulation", done: true },
            { text: "Interfaces", done: true },
            { text: "Design Patterns", done: false },
            { text: "SOLID Principles", done: false },
        ]
    },
    {
        title: "DBMS",
        topics: [
            { text: "ER Diagrams", done: true },
            { text: "Normalization", done: true },
            { text: "SQL Joins", done: true },
            { text: "Indexing", done: true },
            { text: "Transactions", done: false },
            { text: "ACID", done: false },
            { text: "NoSQL", done: false },
            { text: "Sharding", done: false },
        ]
    },
    {
        title: "OS",
        topics: [
            { text: "Processes & Threads", done: true },
            { text: "Scheduling", done: true },
            { text: "Memory Management", done: false },
            { text: "Virtual Memory", done: false },
            { text: "File Systems", done: false },
            { text: "Deadlocks", done: false },
            { text: "Semaphores", done: false },
            { text: "IPC", done: false },
        ]
    },
    {
        title: "CN",
        topics: [
            { text: "OSI Model", done: true },
            { text: "TCP/IP", done: true },
            { text: "HTTP/HTTPS", done: true },
            { text: "DNS", done: false },
            { text: "Sockets", done: false },
            { text: "Load Balancing", done: false },
            { text: "CDN", done: false },
            { text: "Security", done: false },
        ]
    }
];

const RESOURCES = [
    { name: "Striver DSA Sheet", category: "DSA", priority: "High", link: "striver.in" },
    { name: "NeetCode 150", category: "DSA", priority: "High", link: "neetcode.io" },
    { name: "LeetCode SQL 50", category: "SQL", priority: "High", link: "leetcode.com" },
    { name: "SQLZoo", category: "SQL", priority: "Medium", link: "sqlzoo.net" },
    { name: "Supabase Docs", category: "Backend", priority: "High", link: "supabase.com/docs" },
    { name: "Next.js Docs", category: "Frontend", priority: "High", link: "nextjs.org/docs" },
    { name: "Tailwind CSS", category: "Frontend", priority: "Medium", link: "tailwindcss.com" },
    { name: "DBMS by Gate Smashers", category: "CS Theory", priority: "High", link: "YouTube" },
    { name: "OS by Neso Academy", category: "CS Theory", priority: "Medium", link: "YouTube" },
    { name: "CN by Kunal Kushwaha", category: "CS Theory", priority: "Medium", link: "YouTube" },
    { name: "AWS Skill Builder", category: "Cloud", priority: "High", link: "skillbuilder.aws" },
    { name: "Google Cloud Skills", category: "Cloud", priority: "High", link: "cloudskillsboost.google" },
    { name: "DeepLearning.ai", category: "AI/ML", priority: "Medium", link: "deeplearning.ai" },
    { name: "FastAPI Docs", category: "Backend", priority: "Medium", link: "fastapi.tiangolo.com" },
    { name: "MongoDB University", category: "Database", priority: "Low", link: "university.mongodb.com" },
    { name: "Docker Curriculum", category: "DevOps", priority: "Low", link: "dockerlabs.collabnix.com" },
    { name: "GitHub Actions", category: "DevOps", priority: "Low", link: "docs.github.com" },
    { name: "System Design Primer", category: "SDE", priority: "High", link: "GitHub repo" },
    { name: "Grokking Algorithms", category: "DSA", priority: "Medium", link: "Book" },
    { name: "Clean Code", category: "SWE", priority: "Medium", link: "Book" },
];

export default function CoursesPage() {
    const [csData, setCsData] = useState(CS_VARS);
    const [activeTab, setActiveTab] = useState("All");

    const toggleTopic = (catIndex: number, topicIndex: number) => {
        const newData = [...csData];
        newData[catIndex].topics[topicIndex].done = !newData[catIndex].topics[topicIndex].done;
        setCsData(newData);
    };

    const tabs = ["All", "DSA", "SQL", "Backend", "Frontend", "Cloud", "CS Theory", "AI/ML", "Database", "DevOps", "SDE", "SWE"];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 pt-2 animate-fade-in">
            {/* Card 1: Certifications */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-500" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-[#F5F5F5]">Active Certifications</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CERTS.map((cert, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-[#0D0D0D] border border-gray-200 dark:border-[#1F1F1F] rounded-lg p-5 group flex flex-col transition-colors hover:border-blue-200 dark:hover:border-blue-500/30">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", cert.providerColor)}>
                                        {cert.provider}
                                    </span>
                                    <h3 className="text-gray-900 dark:text-[#F5F5F5] font-semibold mt-2">{cert.title}</h3>
                                </div>
                                <span className={cn("text-[10px] font-bold tracking-wide px-2 py-0.5 rounded border", cert.statusColor)}>
                                    {cert.status}
                                </span>
                            </div>
                            <div className="mt-auto">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#1F1F1F] rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all" style={{ width: `${cert.progress}%` }} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 dark:text-[#71717A]">{cert.progress}%</span>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-gray-500 dark:text-[#71717A]">
                                        {cert.earned ? `Earned: ${cert.earned}` : `Target: ${cert.target}`}
                                    </span>
                                    {cert.progress < 100 && (
                                        <button className="text-xs font-semibold text-blue-600 dark:text-blue-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Open Course <ExternalLink className="size-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 2: CS Fundamentals */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Bookmark className="size-5 text-blue-600 dark:text-blue-500" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-[#F5F5F5]">CS Fundamentals</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {csData.map((subj, catIdx) => {
                        const doneCount = subj.topics.filter(t => t.done).length;
                        const progress = (doneCount / subj.topics.length) * 100;
                        return (
                            <div key={subj.title} className="bg-gray-50 dark:bg-[#0D0D0D] border border-gray-200 dark:border-[#1F1F1F] rounded-lg p-5 flex flex-col">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-[#1F1F1F] pb-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-[#F5F5F5]">
                                        {subj.title} <span className="text-xs font-normal text-gray-400 dark:text-[#71717A] ml-1">({subj.topics.length} topics)</span>
                                    </h3>
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                                        {doneCount}/{subj.topics.length} ({progress}%)
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    {subj.topics.map((topic, topIdx) => (
                                        <label key={topIdx} className="flex gap-2 items-start cursor-pointer group">
                                            <div
                                                onClick={() => toggleTopic(catIdx, topIdx)}
                                                className={cn(
                                                    "mt-[2px] size-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                                                    topic.done ? "bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white" : "border-gray-300 dark:border-[#3F3F46] hover:border-blue-400 dark:hover:border-blue-500 bg-transparent"
                                                )}>
                                                {topic.done && <Check className="size-2.5 stroke-[3]" />}
                                            </div>
                                            <span className={cn(
                                                "text-xs leading-tight transition-colors truncate",
                                                topic.done ? "text-gray-400 dark:text-[#52525B] line-through" : "text-gray-700 dark:text-[#F5F5F5] group-hover:text-blue-600 dark:group-hover:text-blue-500"
                                            )}>
                                                {topic.text}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Card 3: Learning Resources */}
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <ExternalLink className="size-5 text-blue-600 dark:text-blue-500" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-[#F5F5F5]">Learning Resources</h2>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                                activeTab === tab
                                    ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-[#1A1A2E] dark:border-blue-500/30 dark:text-blue-500"
                                    : "bg-transparent border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-[#71717A] dark:hover:bg-[#161616] dark:hover:text-[#F5F5F5]"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#1F1F1F]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-[#0D0D0D] border-b border-gray-200 dark:border-[#1F1F1F]">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-[#F5F5F5]">Resource</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-[#F5F5F5]">Category</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-[#F5F5F5]">Priority</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-[#F5F5F5]">Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#1F1F1F]">
                            {RESOURCES.filter(r => activeTab === 'All' || r.category === activeTab).map((row, idx) => {
                                const pColor = row.priority === 'High' ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' :
                                    row.priority === 'Medium' ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' :
                                        'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/10 border-green-200 dark:border-green-900/30';
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#111111]/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-[#F5F5F5]">{row.name}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-[#71717A]">{row.category}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", pColor)}>
                                                {row.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <a href={`http://${row.link}`} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1 opacity-80 hover:opacity-100">
                                                {row.link} <ExternalLink className="size-3" />
                                            </a>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

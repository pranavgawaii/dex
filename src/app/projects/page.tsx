"use client";

import { useState, useEffect } from "react";
import { FolderKanban, Github, ExternalLink, Activity } from "lucide-react";
import { getProjects, Project } from "@/lib/supabase/queries";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProjects().then(data => {
            setProjects(data && data.length > 0 ? data : [
                {
                    id: "1",
                    name: "DEX (Developer OS)",
                    description: "Personal command center built with Next.js, Supabase, and Tailwind. Features DSA tracking, daily logs, and AI-powered insights.",
                    status: "Building",
                    stack_tags: ["Next.js", "TypeScript", "Supabase", "TailwindCSS"],
                    github_url: "https://github.com/pranavgawai/dex",
                    live_url: "https://dex.pranavgawai.com",
                    created_at: new Date().toISOString()
                } as any,
                {
                    id: "2",
                    name: "PlacePro",
                    description: "A comprehensive placement portal for college students to track applications, manage interviews, and learn.",
                    status: "Live",
                    stack_tags: ["React", "Express", "PostgreSQL"],
                    github_url: "https://github.com/pranavgawai/placepro",
                    live_url: "https://placepro.in",
                    created_at: new Date().toISOString()
                } as any,
                {
                    id: "3",
                    name: "AI Caption Generator",
                    description: "Social media tool integrating with Gemini AI to generate LinkedIn and X posts.",
                    status: "Idea",
                    stack_tags: ["Next.js", "Gemini AI", "Framer Motion"],
                    github_url: "",
                    live_url: "",
                    created_at: new Date().toISOString()
                } as any
            ]);
            setLoading(false);
        });
    }, []);

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-500">
                        <FolderKanban size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight font-geist">
                            Projects
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-[#71717A] mt-1">
                            Tracking milestones, deployments, and side-quests.
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#1F1F1F]"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#1F1F1F] p-6 flex flex-col hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-300 shadow-sm relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                                <FolderKanban size={100} className="text-blue-500 -rotate-12 translate-x-4 -translate-y-4" />
                            </div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-[#F5F5F5] truncate pr-4">
                                    {project.name}
                                </h3>
                                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${project.status === "Live" ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-500' : project.status === "Idea" ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500' : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500'}`}>
                                    {project.status.toUpperCase()}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-[#71717A] mb-6 flex-1 line-clamp-3 relative z-10">
                                {project.description}
                            </p>

                            <div className="space-y-4 relative z-10 mt-auto">
                                <div className="flex flex-wrap gap-2">
                                    {(project.stack_tags as string[] || []).map((tech, i) => (
                                        <span key={i} className="text-xs font-medium text-gray-500 dark:text-[#A1A1AA] bg-gray-50 dark:bg-[#1F1F1F] px-2 py-1 rounded-md border border-gray-100 dark:border-[#27272A]">
                                            {tech}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-[#1F1F1F]">
                                    {project.github_url && (
                                        <a href={project.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-[#71717A] hover:text-blue-600 dark:hover:text-blue-500 transition-colors">
                                            <Github size={14} /> Code
                                        </a>
                                    )}
                                    {project.live_url && (
                                        <a href={project.live_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-[#71717A] hover:text-blue-600 dark:hover:text-blue-500 transition-colors">
                                            <ExternalLink size={14} /> Live
                                        </a>
                                    )}
                                    {(!project.github_url && !project.live_url) && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-[#52525B]">
                                            <Activity size={14} /> In Development
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

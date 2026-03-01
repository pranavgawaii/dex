import { NextResponse } from "next/server";
import { getDSAProblems, getTodayLog } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const problems = await getDSAProblems();
        const todoOrRevisit = problems.filter((p) => p.status === "Todo" || p.status === "Revisit");

        // find weakest pattern (most unsolved)
        const patternCounts = todoOrRevisit.reduce((acc, p) => {
            const cat = (p as any).pattern || (p as any).category || "Unknown";
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        let weakestPattern = "Arrays & Hashing";
        let maxUnsolved = 0;
        for (const [pattern, count] of Object.entries(patternCounts)) {
            if (count > maxUnsolved) {
                maxUnsolved = count;
                weakestPattern = pattern;
            }
        }

        const todayLog = await getTodayLog();
        const streak = todayLog?.github_committed ? 12 : 11; // Mock streak for this insight

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "your_key") {
            // Return static fallback if no key provided
            return NextResponse.json({
                insight: `Good work yesterday! You solved 3 medium problems. Today, based on your weakness analysis, I recommend focusing on ${weakestPattern}.`,
                pattern: weakestPattern,
            });
        }

        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: `You are a personal dev coach. The developer's weakest DSA pattern is ${weakestPattern} with ${maxUnsolved} unsolved problems. Their current streak is ${streak} days. Write exactly 2 sentences of personalized coaching advice. Be specific, motivational, and mention the pattern name. Format: plain text only, no markdown.`,
                        },
                    ],
                },
            ],
        };

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }
        );

        if (!res.ok) {
            throw new Error(`Gemini API error: ${res.statusText}`);
        }

        const data = await res.json();
        const insightText =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            `Keep up the momentum! Let's focus on crushing ${weakestPattern} today.`;

        return NextResponse.json({
            insight: insightText,
            pattern: weakestPattern,
        });
    } catch (error) {
        console.error("Briefing error:", error);
        return NextResponse.json({
            insight:
                "Good work yesterday! You solved 3 medium problems on DP. Today, based on your weakness analysis, I recommend focusing on Graph Traversal (BFS/DFS).",
            pattern: "Graph Traversal (BFS/DFS)",
        });
    }
}

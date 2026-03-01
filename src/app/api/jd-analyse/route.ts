import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface JDAnalysisResult {
    match_score: number;
    skills_have: string[];
    skills_missing: string[];
    resume_bullets: string[];
    red_flags: string[];
    salary_estimate: string;
    similar_roles: string[];
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { jd_text } = body as { jd_text: string };

        if (!jd_text?.trim()) {
            return NextResponse.json({ error: "jd_text is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
        }

        const prompt = `Analyse this job description for Pranav Gawai.

Pranav's Profile:
- Final-year B.Tech CSE student, MITADT University, Pune
- Skills: Go (Golang), Next.js 14, TypeScript, Supabase, Python, REST APIs, PostgreSQL
- Strong in backend development, DSA (LeetCode ~200+ problems)
- Projects: DEX (personal OS), placement tracker, SQL practice tools
- Targeting: SDE roles in India, fresher/intern level

Job Description:
${jd_text.slice(0, 4000)}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "match_score": 75,
  "skills_have": ["list of skills in the JD that Pranav already has"],
  "skills_missing": ["list of skills required in the JD that Pranav currently lacks"],
  "resume_bullets": ["2 specific bullet points Pranav should add to his resume for this role"],
  "red_flags": ["any concerning phrases in the JD — e.g. '10+ years', unpaid, non-tech role, bad company signals"],
  "salary_estimate": "string — estimated CTC for this role in India for fresher/junior level",
  "similar_roles": ["3 similar job titles Pranav should also search for"]
}`;

        // Retry logic — max 3 attempts
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { response_mime_type: "application/json" },
                        }),
                        signal: AbortSignal.timeout(15000),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || "Gemini API error");
                }

                const data = await response.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawText) throw new Error("Empty Gemini response");

                const result: JDAnalysisResult = JSON.parse(rawText);

                return NextResponse.json({
                    ...result,
                    analysed_at: new Date().toISOString(),
                });
            } catch (err) {
                lastError = err as Error;
                if (attempt < 3) {
                    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
                }
            }
        }

        // Fallback response if all retries fail
        return NextResponse.json({
            match_score: 60,
            skills_have: ["TypeScript", "REST APIs", "Git"],
            skills_missing: ["Unable to analyse — please try again"],
            resume_bullets: ["Add relevant projects showcasing your backend expertise"],
            red_flags: [],
            salary_estimate: "₹5–12 LPA for fresher SDE in India",
            similar_roles: ["Backend Developer", "Software Engineer", "Full Stack Developer"],
            error: lastError?.message,
            analysed_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error("JD Analyse error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

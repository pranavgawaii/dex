import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SB_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sbHeaders() {
    return {
        "Content-Type": "application/json",
        apikey: SB_KEY(),
        Authorization: `Bearer ${SB_KEY()}`,
    };
}

interface Params {
    params: { company: string };
}

export async function GET(_request: Request, { params }: Params) {
    const companyName = decodeURIComponent(params.company);

    try {
        // Check Supabase cache first
        const cacheRes = await fetch(
            `${SB_URL()}/rest/v1/dex_company_intel?select=*&company_name=ilike.${encodeURIComponent(companyName)}&limit=1`,
            { headers: sbHeaders(), cache: "no-store" }
        );

        let cached: Record<string, unknown> | null = null;
        if (cacheRes.ok) {
            const rows = await cacheRes.json();
            cached = rows[0] ?? null;
        }

        if (cached) {
            const lastScraped = new Date(cached.last_scraped as string);
            const hoursSince = (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60);

            if (hoursSince < 24 && cached.cache_valid) {
                return NextResponse.json({
                    ...cached,
                    from_cache: true,
                    cached_hours_ago: Math.round(hoursSince),
                });
            }
        }

        // No valid cache — generate with Gemini
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            if (cached) return NextResponse.json({ ...cached, from_cache: true, stale: true });
            return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
        }

        const prompt = `You are a placement coach for Pranav Gawai, a final-year CSE student from Pune specialising in Go, Next.js 14, TypeScript, Supabase, Python, REST APIs, backend development.

Generate a comprehensive company intelligence report for "${companyName}" for interview preparation.

Return ONLY a valid JSON object with these exact keys (no markdown, no extra text):
{
  "overview": {
    "name": "string — official company name",
    "industry": "string — e.g. Fintech, SaaS, E-commerce",
    "founded": "string — founding year",
    "hq": "string — headquarters city/country",
    "employees": "string — approximate employee count",
    "products": "string — 2 sentence description of main products/services"
  },
  "tech_stack": ["array of up to 10 technologies commonly used at this company"],
  "top_skills": ["top 5 skills they look for in SDE roles"],
  "interview_qs": [
    {"question": "string", "difficulty": "Easy|Medium|Hard", "role": "string — e.g. SDE, Backend"}
  ],
  "interview_process": "string — step-by-step interview process description",
  "glassdoor_rating": 4.1,
  "culture_summary": "string — 2 sentence pros and cons summary",
  "salary_range": "string — fresher/junior SDE CTC range in India",
  "why_company_ans": "string — genuine 3-sentence why company answer personalised for Pranav's Go+Next.js+backend background",
  "tell_me_about": "string — 60-second Tell me about yourself tailored for applying to this company",
  "fit_score": 75,
  "fit_highlights": ["top 3 things Pranav should highlight in the interview"],
  "fit_gaps": ["top 2 skills/areas Pranav should prepare before the interview"]
}`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { response_mime_type: "application/json" },
                }),
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Gemini API Error details:", errText);
            if (cached) return NextResponse.json({ ...cached, from_cache: true, stale: true });
            return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            if (cached) return NextResponse.json({ ...cached, from_cache: true, stale: true });
            return NextResponse.json({ error: "Empty Gemini response" }, { status: 502 });
        }

        let intel: Record<string, unknown>;
        try {
            intel = JSON.parse(rawText);
        } catch {
            if (cached) return NextResponse.json({ ...cached, from_cache: true, stale: true });
            return NextResponse.json({ error: "Invalid JSON from Gemini" }, { status: 502 });
        }

        // Upsert to Supabase cache via REST API
        const upsertPayload = {
            company_name: companyName,
            overview: intel.overview ?? null,
            tech_stack: (intel.tech_stack as string[]) ?? [],
            top_skills: (intel.top_skills as string[]) ?? [],
            interview_qs: intel.interview_qs ?? null,
            interview_process: (intel.interview_process as string) ?? null,
            glassdoor_rating: (intel.glassdoor_rating as number) ?? null,
            culture_summary: (intel.culture_summary as string) ?? null,
            salary_range: (intel.salary_range as string) ?? null,
            why_company_ans: (intel.why_company_ans as string) ?? null,
            tell_me_about: (intel.tell_me_about as string) ?? null,
            fit_score: (intel.fit_score as number) ?? null,
            fit_highlights: (intel.fit_highlights as string[]) ?? [],
            fit_gaps: (intel.fit_gaps as string[]) ?? [],
            last_scraped: new Date().toISOString(),
            cache_valid: true,
        };

        const saveRes = await fetch(`${SB_URL()}/rest/v1/dex_company_intel`, {
            method: "POST",
            headers: {
                ...sbHeaders(),
                Prefer: "resolution=merge-duplicates,return=representation",
            },
            body: JSON.stringify(upsertPayload),
        });

        let savedRow: Record<string, unknown> = upsertPayload;
        if (saveRes.ok) {
            const rows = await saveRes.json();
            savedRow = rows[0] ?? upsertPayload;
        } else {
            console.error("Cache save error:", await saveRes.text());
        }

        return NextResponse.json({ ...savedRow, from_cache: false });
    } catch (err) {
        console.error("Company intel error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Vercel Cron — runs daily at 1:30 AM UTC (7:00 AM IST)
// Requires CRON_SECRET env var to protect the endpoint
export async function GET(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!geminiKey || !supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: "Missing required environment variables" },
                { status: 500 }
            );
        }

        // Note: On Vercel free tier, Python subprocess cannot run.
        // This cron route uses the Gemini API to generate synthetic recent job data.
        // For actual web scraping, run job_feed_scraper.py locally or on a VPS,
        // which will push data to Supabase directly.
        //
        // For production scraping on Vercel, consider:
        // - GitHub Actions scheduled workflow running the Python scraper
        // - Railway.app free tier running the cron Python script
        // - A simple VPS/local machine cron job running python3 job_feed_scraper.py

        const searchQueries = [
            "software engineer pune",
            "backend developer golang remote",
            "full stack developer nextjs india",
            "sde intern 2025 india",
        ];

        const jobsPerQuery = 5;
        const results = { jobs_generated: 0, new_jobs: 0, timestamp: new Date().toISOString() };

        for (const query of searchQueries) {
            try {
                const prompt = `Generate ${jobsPerQuery} realistic, current (2025-2026) job listings for the search query: "${query}".
These should be real companies actively hiring in India.

Return ONLY a valid JSON array (no markdown):
[
  {
    "title": "string — job title",
    "company": "string — well-known Indian tech company or MNC",
    "location": "string — e.g. Pune / Bengaluru / Remote",
    "job_type": "remote|onsite|hybrid",
    "source": "linkedin|naukri|indeed",
    "url": "https://www.linkedin.com/jobs/search/?keywords=example",
    "description": "string — 3 sentence job description with key skills mentioned",
    "match_score": 75
  }
]`;

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { response_mime_type: "application/json" },
                        }),
                        signal: AbortSignal.timeout(20000),
                    }
                );

                if (!geminiRes.ok) continue;

                const geminiData = await geminiRes.json();
                const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!rawText) continue;

                const jobs: Array<{
                    title: string;
                    company: string;
                    location: string;
                    job_type: string;
                    source: string;
                    url: string;
                    description: string;
                    match_score: number;
                }> = JSON.parse(rawText);

                // Insert to Supabase via REST API
                const insertRes = await fetch(`${supabaseUrl}/rest/v1/dex_jobs`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseServiceKey,
                        Authorization: `Bearer ${supabaseServiceKey}`,
                        Prefer: "resolution=ignore-duplicates",
                    },
                    body: JSON.stringify(
                        jobs.map((j) => ({
                            ...j,
                            posted_at: new Date().toISOString(),
                            scraped_at: new Date().toISOString(),
                        }))
                    ),
                });

                if (insertRes.ok) {
                    results.jobs_generated += jobs.length;
                    results.new_jobs += jobs.length;
                }
            } catch (queryErr) {
                console.error(`Query "${query}" failed:`, queryErr);
            }
        }

        return NextResponse.json({ success: true, ...results });
    } catch (err) {
        console.error("Cron scrape-jobs error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lcSolved, dsaStreak, recentChapter, todayDate } = body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        const prompt = `Generate 2 social media post suggestions for Pranav Gawai,
a software engineering student (MITADT University, Pune)
preparing for placement by August 2026.
Context: solved ${lcSolved} LeetCode problems total,
${dsaStreak} day streak, recently studied ${recentChapter}.
Date: ${todayDate}

Return ONLY valid JSON (no markdown):
{
  "x_post": {
    "content": "tweet text max 240 chars, no hashtag spam, authentic build-in-public voice, specific and real",
    "best_time": "Morning 9AM",
    "type": "Build-in-Public"
  },
  "linkedin_post": {
    "content": "linkedin post 3-4 sentences, professional but personal, ends with insight or question, max 400 chars",
    "best_time": "Morning 8AM",
    "type": "Achievement"
  },
  "tip": "one actionable tip for today based on context, max 80 chars"
}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        response_mime_type: "application/json",
                    },
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            throw new Error(data.error?.message || "Gemini API failure");
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) {
            throw new Error("Empty response from Gemini");
        }

        const parsedResult = JSON.parse(resultText);

        return NextResponse.json({
            ...parsedResult,
            generated_at: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Suggestions API Error:", error);

        // Fallback
        const body = await req.json().catch(() => ({}));
        const streak = body.dsaStreak || 0;
        const recentChapter = body.recentChapter || "DSA";

        return NextResponse.json({
            x_post: {
                content: `Day ${streak} of consistent DSA grind. ${recentChapter} is starting to click. Consistency > intensity.`,
                best_time: "Now",
                type: "Build-in-Public"
            },
            linkedin_post: {
                content: `Just hit a ${streak} day streak on LeetCode. Each problem teaches patience as much as logic. Excited to keep building this momentum toward placement season!`,
                best_time: "Morning 8AM",
                type: "Achievement"
            },
            tip: "Review yesterday's hardest problem once more.",
            generated_at: new Date().toISOString(),
        });
    }
}

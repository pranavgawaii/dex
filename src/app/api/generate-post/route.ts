import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { learned_today } = await req.json();

        if (!learned_today || learned_today.length <= 20) {
            return NextResponse.json(
                { error: "Content must be longer than 20 characters." },
                { status: 400 }
            );
        }

        const prompt = `
You are a personal content assistant for a software engineering student named Pranav who is building in public.

Based on what they learned today:
"${learned_today}"

Generate exactly 3 distinct X (Twitter) posts. 
Each must be under 280 characters.
Keep each post focused, genuine, and developer-friendly.

Post 1 type: Educational tip or insight (teach something)
Post 2 type: Build-in-public update (share progress)  
Post 3 type: Reflection or honest thought (be real)

For each post suggest exactly 2-3 hashtags from:
#BuildInPublic #DSA #100DaysOfCode #WebDev #NextJS
#Supabase #OpenSource #AI #PlacementSeason #CodeNewbie

Respond ONLY with valid JSON in this exact format:
{
  "posts": [
    {
      "type": "Educational",
      "content": "post text here",
      "hashtags": ["#Tag1", "#Tag2"]
    },
    {
      "type": "Build-in-Public",
      "content": "post text here", 
      "hashtags": ["#Tag1", "#Tag2"]
    },
    {
      "type": "Reflection",
      "content": "post text here",
      "hashtags": ["#Tag1", "#Tag2"]
    }
  ]
}
`;

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("Missing GEMINI_API_KEY");
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error("Invalid response format from Gemini");
        }

        const parsed = JSON.parse(textResponse);

        return NextResponse.json({ posts: parsed.posts });
    } catch (error) {
        console.error("Generate Post Error:", error);
        // Fallback
        return NextResponse.json({
            error: false,
            posts: [
                {
                    type: "Educational",
                    content: "Today I learned a lot about this topic. Excited to dig deeper tomorrow and share what I find!",
                    hashtags: ["#BuildInPublic", "#WebDev"]
                },
                {
                    type: "Build-in-Public",
                    content: "Making solid progress on the new features. Some tricky bugs, but nothing we can't solve. Onwards!",
                    hashtags: ["#100DaysOfCode", "#NextJS"]
                },
                {
                    type: "Reflection",
                    content: "Sometimes you just have to step back and look at the big picture. Quality takes time, and that's okay.",
                    hashtags: ["#CodeNewbie", "#DeveloperLife"]
                }
            ]
        });
    }
}

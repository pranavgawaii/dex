import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
    try {
        const { activity, pillar, platforms, mode } = await req.json();

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const baseContext = `You are a personal brand assistant for Pranav Gawai, a 22-year-old CSE AI/ML developer from Pune, India. He builds SaaS projects: PlacePro (placement portal), DEX (personal developer command center). Stack: Next.js, Supabase, TypeScript, AI tools. Goal: Placement by Aug 2026 + grow X following + LinkedIn brand.

Generate captions that feel HUMAN, not corporate. Mix tech content with personality and viral formats.`;

        let prompt = '';

        if (mode === 'week') {
            prompt = `${baseContext}
            
Generate a 7-day weekly content plan based on the user's ongoing projects. 
Output ONLY valid JSON.
Format: { "plan": [ { "day": "MON", "xCaption": "...", "linkedinPost": "...", "pillar": "Builder" }, ... 7 days ] }

Schedule logic:
Mon → Builder + LinkedIn post
Tue → Relatable tweet only (linkedinPost = "")
Wed → Opinion tweet + LinkedIn post
Thu → Learning tweet only (linkedinPost = "")
Fri → Builder tweet + LinkedIn post
Sat → Thread opener tweet (5-7 tweet outline) (linkedinPost = "")
Sun → Engagement bait tweet ("What are you building?") (linkedinPost = "")
`;
        } else {
            prompt = `${baseContext}
            
X caption styles to rotate: 
- Builder: "Just shipped [X]. Here is what I learned 👇"
- Relatable: "It is 2 AM. Fixed a bug. Feeling unstoppable 🫡"
- Engagement bait: "Hey folks — drop your portfolio below 👇"
- Opinion: "Unpopular take: [controversial dev opinion]"
- Personal: "22. Building solo. Scared? Yes. Stopping? No."
- Question hook: "What are you building this weekend? 🧵"

LinkedIn style: Professional but human. Story-driven. 150 words max. First line = strong hook. End with question.

Generate based on:
Activity today: ${activity}
Pillar selected: ${pillar}

X captions: max 280 chars each. Punchy. No hashtag spam. Only 1 hashtag max per X caption (#BuildInPublic preferred).
LinkedIn: 0-2 hashtags max.

Output ONLY valid JSON:
{
  "xCaptions": [
     { "text": "...", "tone": "...", "time": "8 PM IST", "hashtag": "..." },
     { "text": "...", "tone": "...", "time": "9 AM IST", "hashtag": "..." },
     { "text": "...", "tone": "...", "time": "2 PM IST", "hashtag": "..." }
  ],
  "linkedinPost": {
     "text": "...", "time": "9 AM IST on weekdays", "wordCount": 120
  }
}
`;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json",
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "Gemini API failed");
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("No text returned from Gemini");
        }

        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Something went wrong" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, history, page } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json({ reply: "I didn't quite catch that." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Missing Gemini key");
        }

        // Prepare context
        const systemPrompt = `You are DEX, a friendly robot mascot (Resource Engine assistant) for Pranav's personal developer command center.
Target: software engineering student, first job offer by August 2026.
Goals: NeetCode 150, SQL 50, projects, certifications, X/LinkedIn growth.
Current Page: ${page}.
Constraint: Be warm, very brief (approx 40-50 words), end with a specific action. 1 emoji. No bullets. 
ALWAYS stay in character as DEX.`;

        // Map history to Gemini format (limiting to last 10 turns)
        let chatHistory = (history || []).map((m: any) => ({
            role: m.sender === "navi" ? "model" : "user",
            parts: [{ text: m.text }]
        }));

        // Gemini multi-turn chat MUST start with a 'user' message.
        // If the first message is a 'model' greeting, we remove it or prepend context.
        if (chatHistory.length > 0 && chatHistory[0].role === "model") {
            chatHistory.shift();
        }

        // Limit to last 10 messages
        chatHistory = chatHistory.slice(-10);

        // Add current message
        const contents = [
            ...chatHistory,
            {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
            }
        ];

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
        });

        if (!res.ok) {
            throw new Error(`Gemini API error: ${res.statusText}`);
        }

        const data = await res.json();
        const geminiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!geminiReply) {
            throw new Error("Empty reply from Gemini");
        }

        return NextResponse.json({ reply: geminiReply.trim() });
    } catch (error) {
        console.error("Navi API Error:", error);

        return NextResponse.json(
            { reply: getFallbackReply(req.url) },
            { status: 200 } // Still return 200 so the UI displays it cleanly as a fallback
        );
    }
}

function getFallbackReply(urlStr: string) {
    let fallback = "Every line of code counts. Keep going!";
    if (urlStr.includes("/dsa")) {
        fallback = "Keep solving! Consistency beats intensity. Try one more problem today.";
    } else if (urlStr.includes("/sql")) {
        fallback = "SQL is your placement superpower. Practice one query now.";
    } else if (urlStr.includes("/goals")) {
        fallback = "You're closer than you think. One focused hour moves the needle.";
    }
    return fallback;
}

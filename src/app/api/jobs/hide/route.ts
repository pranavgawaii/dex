import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SB_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const sbHeaders = () => ({
    "Content-Type": "application/json",
    apikey: SB_KEY(),
    Authorization: `Bearer ${SB_KEY()}`,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body as { id: string };

        if (!id) {
            return NextResponse.json({ error: "Job id is required" }, { status: 400 });
        }

        const res = await fetch(
            `${SB_URL()}/rest/v1/dex_jobs?id=eq.${id}`,
            {
                method: "PATCH",
                headers: sbHeaders(),
                body: JSON.stringify({ is_hidden: true }),
            }
        );

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to hide job" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Jobs hide error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

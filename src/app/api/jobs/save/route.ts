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

        // Fetch current is_saved state
        const getRes = await fetch(
            `${SB_URL()}/rest/v1/dex_jobs?id=eq.${id}&select=is_saved`,
            { headers: sbHeaders(), cache: "no-store" }
        );

        if (!getRes.ok) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const [job] = await getRes.json();
        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

        const newSaved = !job.is_saved;

        const updateRes = await fetch(
            `${SB_URL()}/rest/v1/dex_jobs?id=eq.${id}`,
            {
                method: "PATCH",
                headers: sbHeaders(),
                body: JSON.stringify({ is_saved: newSaved }),
            }
        );

        if (!updateRes.ok) {
            return NextResponse.json({ error: "Failed to update" }, { status: 500 });
        }

        return NextResponse.json({ success: true, is_saved: newSaved });
    } catch (err) {
        console.error("Jobs save error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

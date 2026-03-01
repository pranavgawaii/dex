import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SB_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sbHeaders() {
    return {
        "Content-Type": "application/json",
        apikey: SB_KEY(),
        Authorization: `Bearer ${SB_KEY()}`,
    };
}

interface Params {
    params: { id: string };
}

// PATCH — update status, notes, deadline, job_url
export async function PATCH(request: Request, { params }: Params) {
    try {
        const { id } = params;
        const body = await request.json();

        const allowedFields = ["status", "notes", "deadline", "job_url"] as const;
        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (field in body) updates[field] = body[field];
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const res = await fetch(
            `${SB_URL()}/rest/v1/dex_applications?id=eq.${id}`,
            {
                method: "PATCH",
                headers: { ...sbHeaders(), Prefer: "return=representation" },
                body: JSON.stringify(updates),
            }
        );

        if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ error: err }, { status: 500 });
        }

        const [application] = await res.json();
        return NextResponse.json({ application });
    } catch (err) {
        console.error("Application PATCH error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE — remove application
export async function DELETE(_request: Request, { params }: Params) {
    try {
        const { id } = params;

        const res = await fetch(
            `${SB_URL()}/rest/v1/dex_applications?id=eq.${id}`,
            { method: "DELETE", headers: sbHeaders() }
        );

        if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ error: err }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Application DELETE error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const role = searchParams.get("role");
        const location = searchParams.get("location");
        const source = searchParams.get("source");
        const freshness = searchParams.get("freshness") || "7d";
        const minMatchScore = parseInt(searchParams.get("min_match_score") || "0");
        const remoteOnly = searchParams.get("remote_only") === "true";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 20;
        const offset = (page - 1) * limit;

        const freshnessHours: Record<string, number> = {
            "6h": 6, "24h": 24, "3d": 72, "7d": 168,
        };
        const hoursBack = freshnessHours[freshness] ?? 168;
        const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

        // Build PostgREST query string
        const filters: string[] = [
            `is_hidden=eq.false`,
            `scraped_at=gte.${cutoff}`,
            `match_score=gte.${minMatchScore}`,
        ];

        if (role) filters.push(`title=ilike.*${role}*`);
        if (location) filters.push(`location=ilike.*${location}*`);
        if (source) filters.push(`source=eq.${source}`);
        if (remoteOnly) filters.push(`or=(job_type.eq.remote,location.ilike.*remote*)`);

        const queryStr = filters.join("&");
        const rangeHeader = `${offset}-${offset + limit - 1}`;

        const res = await fetch(
            `${SB_URL()}/rest/v1/dex_jobs?select=*&${queryStr}&order=match_score.desc,posted_at.desc&limit=${limit}&offset=${offset}`,
            {
                headers: {
                    ...sbHeaders(),
                    "Range-Unit": "items",
                    Range: rangeHeader,
                    Prefer: "count=exact",
                },
                cache: "no-store",
            }
        );

        if (!res.ok) {
            const err = await res.text();
            console.error("Jobs feed error:", err);
            return NextResponse.json({ error: err }, { status: 500 });
        }

        const jobs = await res.json();
        const contentRange = res.headers.get("Content-Range") ?? "";
        const total = parseInt(contentRange.split("/")[1] ?? "0") || jobs.length;

        return NextResponse.json({
            jobs: jobs ?? [],
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error("Jobs feed unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// We use the Supabase REST API directly to avoid TypeScript type inference issues
// with the newly added tables (which haven't been through supabase gen types yet).
// All operations are equivalent to using the supabase-js client.

const SB_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sbHeaders() {
    return {
        "Content-Type": "application/json",
        apikey: SB_KEY(),
        Authorization: `Bearer ${SB_KEY()}`,
    };
}

// GET — fetch all applications ordered by applied_date DESC
export async function GET() {
    try {
        const res = await fetch(
            `${SB_URL()}/rest/v1/dex_applications?select=*&order=applied_date.desc`,
            { headers: sbHeaders(), cache: "no-store" }
        );

        if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ error: err }, { status: 500 });
        }

        const applications = await res.json();
        return NextResponse.json({ applications: applications ?? [] });
    } catch (err) {
        console.error("Applications GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST — create new application, auto-set logo from Clearbit
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { company, role, status, applied_date, deadline, job_url, notes } = body as {
            company: string;
            role: string;
            status?: string;
            applied_date?: string;
            deadline?: string;
            job_url?: string;
            notes?: string;
        };

        if (!company?.trim() || !role?.trim()) {
            return NextResponse.json({ error: "company and role are required" }, { status: 400 });
        }

        const companyDomain = company.toLowerCase().replace(/\s+/g, "") + ".com";
        const logoUrl = `https://logo.clearbit.com/${companyDomain}`;

        const payload = {
            company: company.trim(),
            role: role.trim(),
            status: status ?? "Applied",
            applied_date: applied_date ?? new Date().toISOString().split("T")[0],
            deadline: deadline || null,
            job_url: job_url || null,
            notes: notes || null,
            logo_url: logoUrl,
        };

        const res = await fetch(`${SB_URL()}/rest/v1/dex_applications`, {
            method: "POST",
            headers: { ...sbHeaders(), Prefer: "return=representation" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ error: err }, { status: 500 });
        }

        const [application] = await res.json();
        return NextResponse.json({ application }, { status: 201 });
    } catch (err) {
        console.error("Applications POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

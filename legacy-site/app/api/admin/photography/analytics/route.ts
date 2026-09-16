import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function checkAdmin(req: NextRequest): boolean {
  const password = process.env.ADMIN_GATE_PASSWORD ?? process.env.WORKOUT_GATE_PASSWORD;
  if (!password) return false;
  const provided = req.headers.get("x-admin-password") ?? "";
  return provided === password;
}

type Row = {
  name: string;
  created_at: string;
};

export async function GET(request: NextRequest) {
  if (!checkAdmin(request))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const days = Math.max(
    1,
    Math.min(
      180,
      parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10) || 30
    )
  );
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("photo_analytics_events")
      .select("name, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);
    if (error) throw error;

    const rows = (data ?? []) as Row[];
    const byName: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const byNameByDay: Record<string, Record<string, number>> = {};

    for (const row of rows) {
      byName[row.name] = (byName[row.name] ?? 0) + 1;
      const day = row.created_at.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
      byNameByDay[row.name] ??= {};
      byNameByDay[row.name][day] = (byNameByDay[row.name][day] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      days,
      byName,
      byDay,
      byNameByDay,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

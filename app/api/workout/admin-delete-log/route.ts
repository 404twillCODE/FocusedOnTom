import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserEmailFromRequest, isEmailAdmin } from "@/lib/supabase/admin";

/** Admin-only: delete any workout_logs entry by id. Checks app_admins table by email. */
export async function POST(request: NextRequest) {
  const user = await getUserEmailFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await isEmailAdmin(user.email);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch (e) {
    console.error("admin-delete-log getSupabaseAdmin:", e);
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const logId = body?.logId;
  if (!logId || typeof logId !== "string") {
    return NextResponse.json({ error: "Missing logId" }, { status: 400 });
  }

  try {
    const { error } = await adminClient
      .from("workout_logs")
      .delete()
      .eq("id", logId);

    if (error) {
      console.error("admin-delete-log:", error);
      return NextResponse.json({ error: "Failed to delete log" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin-delete-log error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}

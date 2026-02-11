import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest } from "@/lib/supabase/admin";

const DEFAULT_MODES = {
  progressiveOverload: true,
  dropSets: false,
  rpe: false,
  supersets: false,
  amrap: false,
};
const DEFAULT_PREFERENCES = {
  timer_enabled: false,
  timer_default_sec: null,
  units: "lbs",
  show_suggestions: true,
};

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. Try signing out and back in, then try again." },
      { status: 401 }
    );
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    console.error("reset-all getSupabaseAdmin:", e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 503 }
    );
  }

  try {
    const { data: sessions } = await admin
      .from("workout_sessions")
      .select("id")
      .eq("user_id", userId);
    const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);

    if (sessionIds.length > 0) {
      const { data: exercises } = await admin
        .from("workout_exercises")
        .select("id")
        .in("session_id", sessionIds);
      const exerciseIds = (exercises ?? []).map((e: { id: string }) => e.id);

      if (exerciseIds.length > 0) {
        const { error: setsErr } = await admin
          .from("workout_sets")
          .delete()
          .in("exercise_id", exerciseIds);
        if (setsErr) {
          console.error("reset-all workout_sets delete:", setsErr);
          return NextResponse.json(
            { error: "Failed to delete workout sets" },
            { status: 500 }
          );
        }
      }

      const { error: exErr } = await admin
        .from("workout_exercises")
        .delete()
        .in("session_id", sessionIds);
      if (exErr) {
        console.error("reset-all workout_exercises delete:", exErr);
        return NextResponse.json(
          { error: "Failed to delete workout exercises" },
          { status: 500 }
        );
      }

      const { error: sessErr } = await admin
        .from("workout_sessions")
        .delete()
        .eq("user_id", userId);
      if (sessErr) {
        console.error("reset-all workout_sessions delete:", sessErr);
        return NextResponse.json(
          { error: "Failed to delete workout sessions" },
          { status: 500 }
        );
      }
    }

    await admin.from("template_exercises").delete().eq("user_id", userId);
    await admin.from("workout_templates").delete().eq("user_id", userId);
    await admin.from("exercise_history").delete().eq("user_id", userId);
    await admin.from("workout_settings").delete().eq("user_id", userId);

    const payload: Record<string, unknown> = {
      user_id: userId,
      tracking_style: "schedule",
      selected_days: null,
      schedule_map: null,
      rotation: null,
      modes: DEFAULT_MODES,
      preferences: DEFAULT_PREFERENCES,
      setup_completed: false,
    };
    const { error: upsertErr } = await admin
      .from("workout_settings")
      .upsert(payload, { onConflict: "user_id" });
    if (upsertErr) {
      console.error("reset-all workout_settings upsert:", upsertErr);
      return NextResponse.json(
        { error: "Failed to reset settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }
  catch (err) {
    console.error("Workout reset-all error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reset failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
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
      console.error("reset-setup getSupabaseAdmin:", e);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const defaultSetup = {
      setup_completed: false,
      tracking_style: "schedule",
      selected_days: null,
      schedule_map: null,
      rotation: null,
      modes: {
        progressiveOverload: true,
        dropSets: false,
        rpe: false,
        supersets: false,
        amrap: false,
      },
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await admin
      .from("workout_settings")
      .update(defaultSetup)
      .eq("user_id", userId)
      .select("user_id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to reset setup" },
        { status: 500 }
      );
    }
    if (!updated) {
      // No row existed; insert default row (keep preferences at defaults)
      const { error: insertErr } = await admin.from("workout_settings").insert({
        user_id: userId,
        ...defaultSetup,
        preferences: {
          timer_enabled: false,
          timer_default_sec: null,
          units: "lbs",
          show_suggestions: true,
        },
      });
      if (insertErr) {
        return NextResponse.json(
          { error: "Failed to reset setup" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Workout reset-setup error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reset failed" },
      { status: 500 }
    );
  }
}

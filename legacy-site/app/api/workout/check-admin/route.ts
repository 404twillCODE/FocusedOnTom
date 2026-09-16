import { NextRequest, NextResponse } from "next/server";
import { getUserEmailFromRequest, isEmailAdmin } from "@/lib/supabase/admin";

/** Check if the current user is an app admin. */
export async function GET(request: NextRequest) {
  const user = await getUserEmailFromRequest(request);
  if (!user) {
    return NextResponse.json({ admin: false });
  }
  const admin = await isEmailAdmin(user.email);
  return NextResponse.json({ admin });
}

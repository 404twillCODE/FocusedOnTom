import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

type Payload = {
  userIds: string[];
  title: string;
  body: string;
  url?: string;
};

export async function POST(req: Request) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return NextResponse.json(
      { error: "VAPID configuration missing" },
      { status: 500 }
    );
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userIds, title, url } = body;
  const messageBody = body.body;

  if (!Array.isArray(userIds) || userIds.length === 0 || !title || !messageBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    console.error("push/send getSupabaseAdmin:", error);
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const failures: string[] = [];
  const deletions: string[] = [];

  await Promise.all(
    (subs ?? []).map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title,
            body: messageBody,
            url: url ?? "/workout",
          })
        );
      } catch (err: any) {
        const statusCode = err?.statusCode ?? err?.status;
        if (statusCode === 404 || statusCode === 410) {
          deletions.push(sub.id);
        } else {
          failures.push(sub.id);
        }
      }
    })
  );

  if (deletions.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("id", deletions);
  }

  return NextResponse.json({
    sent: (subs ?? []).length - failures.length,
    failed: failures.length,
    cleanedUp: deletions.length,
  });
}


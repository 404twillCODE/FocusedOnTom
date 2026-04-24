import Link from "next/link";
import { Check, Download, Sparkles } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PHOTO_BRAND } from "@/lib/photography-config";

export const dynamic = "force-dynamic";

async function getOrderBySession(sessionId: string) {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("photo_orders")
      .select("id, photo_id, license, buyer_email, download_token, status, amount_cents")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; kind?: string }>;
}) {
  const { session_id: sessionId, kind } = await searchParams;
  const order = sessionId ? await getOrderBySession(sessionId) : null;

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-2xl px-4 pt-28 pb-24 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/15 text-[var(--ice)]">
            {kind === "subscription" ? (
              <Sparkles className="h-6 w-6" />
            ) : (
              <Check className="h-6 w-6" />
            )}
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
            {kind === "subscription"
              ? "Welcome to Unlimited"
              : "Thanks for your purchase"}
          </h1>
          <p className="mt-2 max-w-lg text-[var(--textMuted)]">
            {kind === "subscription"
              ? "Your watermark-free browsing is now active. Reload any gallery and the overlay will disappear."
              : order
                ? "We emailed your download link. You can also download it right now below."
                : "Your payment went through. A confirmation email is on its way."}
          </p>

          {order?.download_token && (
            <Link
              href={`/api/photo/download/${order.download_token}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--ice)]/50 bg-[var(--ice)]/15 px-4 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/25"
            >
              <Download className="h-4 w-4" />
              Download your photo
            </Link>
          )}

          <div className="mt-8 flex items-center gap-3 text-sm">
            <Link
              href="/photography"
              className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-4 py-2 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
            >
              Back to galleries
            </Link>
            <Link
              href="/photography/purchases"
              className="rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-4 py-2 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
            >
              View purchases
            </Link>
          </div>

          <p className="mt-8 text-xs text-[var(--textMuted)]">
            Questions? Reply to the receipt email or contact{" "}
            <a
              href={`mailto:${PHOTO_BRAND.contactEmail}`}
              className="text-[var(--ice)]"
            >
              {PHOTO_BRAND.contactEmail}
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

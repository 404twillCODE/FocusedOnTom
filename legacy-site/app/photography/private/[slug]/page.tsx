import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PRIVATE_GALLERY_COOKIE_NAME,
  verifyPrivateGalleryCookie,
} from "@/lib/photography-tokens";
import { getPrivateBundleBySlug } from "@/lib/photography-private";
import { PrivateGalleryView } from "@/components/photography/PrivateGalleryView";
import type { PrivateGalleryState } from "@/lib/photography-types";

export const dynamic = "force-dynamic";

const STATE_COPY: Record<
  PrivateGalleryState,
  { label: string; tone: string; description: string }
> = {
  proofing: {
    label: "Proofing",
    tone: "border-[var(--ice)]/40 bg-[var(--ice)]/10 text-[var(--ice)]",
    description:
      "Heart the photos you want edited, then hit Submit selections when you're done.",
  },
  editing: {
    label: "Editing",
    tone: "border-amber-400/40 bg-amber-500/10 text-amber-200",
    description: "We've got your selections and are working on the final edits.",
  },
  final_delivery: {
    label: "Final delivery",
    tone: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
    description:
      "Your edited photos are ready. Review below and hit Approve to wrap things up.",
  },
  approved: {
    label: "Approved",
    tone: "border-[var(--ice)]/40 bg-[var(--ice)]/10 text-[var(--ice)]",
    description: "All done — thanks! You can download your photos any time.",
  },
};

export default async function PrivateGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const cookieStore = await cookies();
  const token = cookieStore.get(PRIVATE_GALLERY_COOKIE_NAME)?.value;
  const claims = token ? await verifyPrivateGalleryCookie(token) : null;
  if (!claims || claims.slug !== slug) {
    redirect(`/photography/private/${encodeURIComponent(slug)}/login`);
  }

  const admin = getSupabaseAdmin();
  const { data: gallery } = await admin
    .from("private_galleries")
    .select("id, slug, title, state, allow_all_zip, final_message")
    .eq("id", claims.gid)
    .maybeSingle();
  if (!gallery) notFound();

  const [{ data: favoriteRows }, { data: finalRows }] = await Promise.all([
    admin
      .from("private_favorites")
      .select("photo_path, submitted")
      .eq("gallery_id", gallery.id),
    admin
      .from("private_gallery_photos")
      .select("photo_path, is_final, final_url")
      .eq("gallery_id", gallery.id)
      .eq("is_final", true),
  ]);

  const bundle = getPrivateBundleBySlug(slug);
  const photos = bundle?.photos ?? [];
  const favoritesSet = new Set(
    (favoriteRows ?? []).map((f) => f.photo_path)
  );
  const submitted = (favoriteRows ?? []).some((f) => f.submitted);
  const finalPhotos = (finalRows ?? []).map((f) => ({
    path: f.photo_path,
    url: f.final_url ?? "",
  }));

  const state = gallery.state as PrivateGalleryState;
  const copy = STATE_COPY[state];

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 sm:pt-28">
        <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
          <Link
            href="/photography"
            className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Photography
          </Link>
          <span className="text-[var(--textMuted)]">/</span>
          <span className="text-[var(--ice)]">Private · {gallery.title}</span>
        </nav>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.5rem]">
              {gallery.title}
            </h1>
            <p className="mt-2 max-w-xl text-[var(--textMuted)]">
              {copy.description}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${copy.tone}`}
          >
            {copy.label}
          </span>
        </div>
      </section>

      <PrivateGalleryView
        slug={slug}
        state={state}
        photos={photos}
        initialFavorites={[...favoritesSet]}
        finalPhotos={finalPhotos}
        allowAllZip={gallery.allow_all_zip}
        submitted={submitted}
        finalMessage={gallery.final_message}
      />
    </main>
  );
}

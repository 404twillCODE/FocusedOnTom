import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadPhotoById } from "@/lib/photography-source";
import { PRINT_PRODUCT } from "@/lib/photography-config";
import { PrintOrderForm } from "@/components/photography/PrintOrderForm";

export const dynamic = "force-dynamic";

export default async function PrintPhotoPage({
  params,
}: {
  params: Promise<{ photoId: string }>;
}) {
  const { photoId } = await params;
  const photo = await loadPhotoById(photoId);
  if (!photo) notFound();

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6">
        <Link
          href="/photography"
          className="inline-flex items-center gap-2 text-sm text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to gallery
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg3)]/40">
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="px-4 py-3 text-xs text-[var(--textMuted)]">
              {photo.categoryTitle} · {photo.eventTitle}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
              Order a print
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Turn this shot into a wall print
            </h1>
            <p className="mt-3 max-w-md text-[var(--textMuted)]">
              Archival giclée printing. Choose a size and finish — we&apos;ll
              send you a proof before fulfillment.
            </p>

            <PrintOrderForm
              photoId={photo.id ?? photoId}
              photoPath={photo.path ?? ""}
              photoUrl={photo.src}
              product={PRINT_PRODUCT}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

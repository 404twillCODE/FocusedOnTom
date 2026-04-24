"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { photoCategories, eventPageHref, type Photo } from "@/lib/photography";
import { useFavoritePhotos } from "@/lib/photography-likes";
import { supabase } from "@/lib/supabase/client";
import { Lightbox } from "@/components/Lightbox";

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedBlock({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pre-flatten every public photo once with a lookup map by id. Local page
 * data is already in memory (manifest), so this is effectively free.
 */
function buildPhotoIndex(): Map<string, Photo> {
  const map = new Map<string, Photo>();
  for (const cat of photoCategories) {
    for (const ev of cat.events) {
      for (const photo of ev.photos) {
        if (photo.id) map.set(photo.id, photo);
      }
    }
  }
  return map;
}

export default function FavoritesPage() {
  const { favorites } = useFavoritePhotos();
  const [serverFavorites, setServerFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: auth } = await supabase.auth.getSession();
        const token = auth.session?.access_token;
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }
        const res = await fetch("/api/photo/favorite", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as {
          favorites?: Array<{ photo_id: string }>;
        };
        if (!cancelled) {
          setServerFavorites(
            (data.favorites ?? []).map((f) => f.photo_id)
          );
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const photoIndex = useMemo(() => buildPhotoIndex(), []);

  const combinedIds = useMemo(() => {
    const set = new Set<string>([...favorites, ...serverFavorites]);
    return [...set];
  }, [favorites, serverFavorites]);

  const photos: Photo[] = useMemo(() => {
    return combinedIds
      .map((id) => photoIndex.get(id))
      .filter((p): p is Photo => Boolean(p));
  }, [combinedIds, photoIndex]);

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-12">
        <AnimatedBlock>
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]"
          >
            <Link
              href="/photography"
              className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Photography
            </Link>
            <span className="text-[var(--textMuted)]">/</span>
            <span className="text-[var(--ice)]">Favorites</span>
          </nav>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.5rem]">
                Your saved photos
              </h1>
              <p className="mt-2 max-w-lg text-[var(--textMuted)]">
                Photos you&apos;ve bookmarked from the lightbox live here.
                Sign in to sync across devices.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5 text-xs font-mono text-[var(--textMuted)]">
              <Heart className="h-3.5 w-3.5 text-[var(--ice)]" />
              {String(photos.length).padStart(2, "0")} saved
            </div>
          </div>
        </AnimatedBlock>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-20 text-[var(--textMuted)]">
            Loading your saved photos…
          </div>
        ) : photos.length === 0 ? (
          <AnimatedBlock>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-20 text-center">
              <p className="text-base font-medium text-[var(--text)]">
                No favorites yet.
              </p>
              <p className="mt-1 max-w-sm text-sm text-[var(--textMuted)]">
                Open any photo in the lightbox and hit the bookmark to save it
                here.
              </p>
              <Link
                href="/photography"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--ice)]/40 bg-[var(--ice)]/10 px-4 py-2 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/20"
              >
                Browse galleries
              </Link>
            </div>
          </AnimatedBlock>
        ) : (
          <ul className="masonry">
            {photos.map((photo, i) => (
              <li key={photo.id ?? photo.src}>
                <AnimatedBlock delay={Math.min(0.02 * i, 0.25)}>
                  <motion.button
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", bounce: 0.35 }}
                    className="group relative block w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg3)] transition-all duration-300 hover:border-[var(--ice)]/40"
                    aria-label={`Open photo: ${photo.alt}`}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 text-[11px] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="truncate">
                        {photo.categorySlug} · {photo.eventSlug}
                      </span>
                      {photo.categorySlug && photo.eventSlug && (
                        <Link
                          href={eventPageHref(photo.categorySlug, photo.eventSlug)}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/90 backdrop-blur transition-colors hover:bg-white/20"
                        >
                          View event
                        </Link>
                      )}
                    </span>
                  </motion.button>
                </AnimatedBlock>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Lightbox
        photos={photos}
        index={activeIndex}
        onClose={() => setActiveIndex(null)}
        onIndexChange={setActiveIndex}
      />
    </main>
  );
}

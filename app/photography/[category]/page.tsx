"use client";

import { use, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, ImageIcon } from "lucide-react";
import { eventPageHref, getCategory, getCoverPhoto } from "@/lib/photography";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
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
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = use(params);
  const category = getCategory(categorySlug);
  if (!category) notFound();

  const totalPhotos = category.events.reduce(
    (acc, e) => acc + e.photos.length,
    0
  );
  const hasEvents = category.events.length > 0;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-12">
        <AnimatedBlock>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]"
          >
            <Link
              href="/photography"
              className="inline-flex items-center gap-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
            >
              <ArrowLeft className="h-3 w-3" />
              Photography
            </Link>
            <span className="text-[var(--textMuted)]">/</span>
            <span className="text-[var(--ice)]">{category.title}</span>
          </nav>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.75rem]">
                {category.title}
              </h1>
              <p className="mt-3 text-[var(--textMuted)] prose-custom">
                {category.description ?? category.tagline}
              </p>
            </div>
            <div className="flex items-center gap-5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--textMuted)]">
              <span>
                <span className="font-mono text-[var(--text)]">
                  {String(category.events.length).padStart(2, "0")}
                </span>{" "}
                events
              </span>
              <span className="h-3 w-px bg-[var(--border)]" aria-hidden />
              <span>
                <span className="font-mono text-[var(--text)]">
                  {String(totalPhotos).padStart(2, "0")}
                </span>{" "}
                photos
              </span>
            </div>
          </div>
        </AnimatedBlock>
      </section>

      {/* Events */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        {hasEvents ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {category.events.map((event, i) => {
              const cover = getCoverPhoto(event);
              return (
                <AnimatedBlock
                  key={event.slug}
                  delay={0.05 * (i + 1)}
                  className="flex"
                >
                  <motion.li
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", bounce: 0.35 }}
                    className="group relative flex w-full"
                  >
                    <Link
                      href={eventPageHref(category.slug, event.slug)}
                      className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 transition-all duration-300 ease-out hover:border-[var(--ice)]/40 hover:shadow-[0_20px_60px_-30px_rgba(125,211,252,0.45)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg3)]">
                        {cover ? (
                          <Image
                            src={cover.src}
                            alt={cover.alt}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--bg3)] to-[var(--bg2)]">
                            <Camera className="h-8 w-8 text-[var(--textMuted)] opacity-60" />
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg2)] via-transparent to-transparent opacity-80" />
                        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur">
                          <ImageIcon className="h-3 w-3" />
                          {event.photos.length}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--textMuted)]">
                              <span>{event.date}</span>
                              {event.location && (
                                <>
                                  <span className="h-2.5 w-px bg-[var(--border)]" aria-hidden />
                                  <span className="truncate">{event.location}</span>
                                </>
                              )}
                            </div>
                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-[var(--text)] transition-colors duration-300 group-hover:text-[var(--ice)] sm:text-xl">
                              {event.title}
                            </h2>
                            {event.summary && (
                              <p className="mt-1 text-sm text-[var(--textMuted)]">
                                {event.summary}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--textMuted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--ice)]" />
                        </div>
                      </div>
                    </Link>
                  </motion.li>
                </AnimatedBlock>
              );
            })}
          </ul>
        ) : (
          <AnimatedBlock>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-20 text-center">
              <Camera className="h-8 w-8 text-[var(--ice)] opacity-80" />
              <p className="mt-4 text-base font-medium text-[var(--text)]">
                Nothing here yet.
              </p>
              <p className="mt-1 max-w-sm text-sm text-[var(--textMuted)]">
                I&apos;m adding {category.title.toLowerCase()} shots soon. Check
                back — or browse another category.
              </p>
              <Link
                href="/photography"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ice)] transition-transform hover:translate-x-[-2px]"
              >
                <ArrowLeft className="h-4 w-4" />
                All categories
              </Link>
            </div>
          </AnimatedBlock>
        )}
      </section>
    </main>
  );
}

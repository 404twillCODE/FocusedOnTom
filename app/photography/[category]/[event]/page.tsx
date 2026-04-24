"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { categoryPageHref, getEvent } from "@/lib/photography";
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

function titleCaseFromSegment(segment: string) {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFolderLabel(folderKey: string) {
  if (!folderKey) return "Top level";
  return folderKey
    .split("/")
    .map((segment) => titleCaseFromSegment(segment))
    .join(" / ");
}

function getFolderAnchorId(folderKey: string) {
  if (!folderKey) return "folder-highlights";
  return `folder-${folderKey
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/\//g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export default function EventPage({
  params,
}: {
  params: Promise<{ category: string; event: string }>;
}) {
  const { category: categorySlug, event: eventSlug } = use(params);
  const match = getEvent(categorySlug, eventSlug);
  if (!match) notFound();
  const { category, event } = match;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const groupedPhotos = event.photos.reduce(
    (groups, photo, index) => {
      const key = photo.folderPath ?? "";
      const existing = groups.find((group) => group.key === key);
      if (existing) {
        existing.items.push({ photo, index });
        return groups;
      }
      groups.push({
        key,
        label: getFolderLabel(key),
        items: [{ photo, index }],
      });
      return groups;
    },
    [] as Array<{
      key: string;
      label: string;
      items: Array<{ photo: (typeof event.photos)[number]; index: number }>;
    }>
  );

  /** All images live directly under the event folder (no drifting/day-1, etc.) */
  const isFlatEventOnly =
    groupedPhotos.length === 1 && groupedPhotos[0].key === "";

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-10">
        <AnimatedBlock>
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]"
          >
            <Link
              href="/photography"
              className="text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
            >
              Photography
            </Link>
            <span className="text-[var(--textMuted)]">/</span>
            <Link
              href={categoryPageHref(category.slug)}
              className="text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
            >
              {category.title}
            </Link>
            <span className="text-[var(--textMuted)]">/</span>
            <span className="text-[var(--ice)]">{event.title}</span>
          </nav>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--textMuted)]">
                <span>{event.date}</span>
                {event.location && (
                  <>
                    <span className="h-2.5 w-px bg-[var(--border)]" aria-hidden />
                    <span>{event.location}</span>
                  </>
                )}
                <span className="h-2.5 w-px bg-[var(--border)]" aria-hidden />
                <span>
                  <span className="font-mono text-[var(--text)]">
                    {String(event.photos.length).padStart(2, "0")}
                  </span>{" "}
                  photos
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.5rem]">
                {event.title}
              </h1>
              {event.summary && (
                <p className="mt-3 text-[var(--textMuted)] prose-custom">
                  {event.summary}
                </p>
              )}
            </div>
            <Link
              href={categoryPageHref(category.slug)}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {category.title}
            </Link>
          </div>
        </AnimatedBlock>
      </section>

      {/* Photo grid — grouped by folder path (drifting/day-1, etc.) */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        {event.photos.length > 0 ? (
          isFlatEventOnly ? (
            <AnimatedBlock>
              <ul className="masonry">
                {groupedPhotos[0].items.map(({ photo, index }, i) => (
                  <li key={photo.src}>
                    <AnimatedBlock delay={Math.min(0.02 * i, 0.4)}>
                      <motion.button
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        whileHover={{ y: -3 }}
                        transition={{ type: "spring", bounce: 0.35 }}
                        className="group relative block w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg3)] transition-all duration-300 hover:border-[var(--ice)]/40 focus:border-[var(--ice)]/60 focus:outline-none"
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
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                      </motion.button>
                    </AnimatedBlock>
                  </li>
                ))}
              </ul>
            </AnimatedBlock>
          ) : (
            <div className="space-y-10">
              <AnimatedBlock>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--textMuted)]">
                  Folders
                </div>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedPhotos.map((group) => {
                    const cover = group.items[0]?.photo;
                    return (
                      <motion.li
                        key={`jump-${group.key || "root"}`}
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", bounce: 0.35 }}
                        className="group"
                      >
                        <a
                          href={`#${getFolderAnchorId(group.key)}`}
                          className="relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 transition-all duration-300 hover:border-[var(--ice)]/40 hover:shadow-[0_18px_50px_-30px_rgba(125,211,252,0.45)]"
                        >
                          {cover && (
                            <div className="relative aspect-[16/10]">
                              <Image
                                src={cover.src}
                                alt={cover.alt}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                            </div>
                          )}
                          <div
                            className={`flex items-end justify-between gap-3 p-4 ${cover ? "absolute inset-x-0 bottom-0" : ""}`}
                          >
                            <div className="min-w-0">
                              <div
                                className={`truncate text-sm font-medium sm:text-[15px] ${cover ? "text-white" : "text-[var(--text)]"}`}
                              >
                                {group.label}
                              </div>
                              <div
                                className={`mt-1 text-[11px] font-mono uppercase tracking-[0.14em] ${cover ? "text-white/75" : "text-[var(--textMuted)]"}`}
                              >
                                {String(group.items.length).padStart(2, "0")} photos
                              </div>
                            </div>
                            <ArrowRight
                              className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--ice)] ${cover ? "text-white/80" : "text-[var(--textMuted)]"}`}
                            />
                          </div>
                        </a>
                      </motion.li>
                    );
                  })}
                </ul>
              </AnimatedBlock>

              {groupedPhotos.map((group, groupIdx) => (
                <AnimatedBlock
                  key={group.key || "root"}
                  delay={groupIdx * 0.05}
                >
                  <div id={getFolderAnchorId(group.key)}>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--ice)] sm:text-base">
                        {group.label}
                      </h2>
                      <span className="text-xs font-mono text-[var(--textMuted)]">
                        {String(group.items.length).padStart(2, "0")} photos
                      </span>
                    </div>
                    <ul className="masonry">
                      {group.items.map(({ photo, index }, i) => (
                        <li key={photo.src}>
                          <AnimatedBlock delay={Math.min(0.02 * i, 0.25)}>
                            <motion.button
                              type="button"
                              onClick={() => setActiveIndex(index)}
                              whileHover={{ y: -3 }}
                              transition={{ type: "spring", bounce: 0.35 }}
                              className="group relative block w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg3)] transition-all duration-300 hover:border-[var(--ice)]/40 focus:border-[var(--ice)]/60 focus:outline-none"
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
                              <span
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                              />
                            </motion.button>
                          </AnimatedBlock>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedBlock>
              ))}
            </div>
          )
        ) : (
          <AnimatedBlock>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/40 px-6 py-20 text-center">
              <p className="text-base font-medium text-[var(--text)]">
                Photos coming soon.
              </p>
              <p className="mt-1 max-w-sm text-sm text-[var(--textMuted)]">
                I&apos;m still editing this set — check back in a bit.
              </p>
            </div>
          </AnimatedBlock>
        )}
      </section>

      <Lightbox
        photos={event.photos}
        index={activeIndex}
        onClose={() => setActiveIndex(null)}
        onIndexChange={setActiveIndex}
      />
    </main>
  );
}

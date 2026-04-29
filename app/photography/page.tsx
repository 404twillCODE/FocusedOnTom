"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Calendar,
  Camera,
  ImageIcon,
  Instagram,
  LogIn,
  Rss,
  Sparkles,
} from "lucide-react";
import {
  categoryPageHref,
  countPhotos,
  getCoverPhoto,
  photoCategories,
} from "@/lib/photography";
import { PHOTOGRAPHY_INSTAGRAM_URL } from "@/lib/social-links";
import { NewsletterForm } from "@/components/photography/NewsletterForm";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 22 },
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
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function PhotographyPage() {
  const totalPhotos = photoCategories.reduce(
    (acc, c) => acc + countPhotos(c),
    0
  );
  const totalEvents = photoCategories.reduce(
    (acc, c) => acc + c.events.length,
    0
  );

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-12">
        <AnimatedBlock>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[var(--border)]" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
              Photography
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl md:text-[2.75rem]">
              Cars, landscapes, and the moments in between.
            </h1>
            <div className="flex items-center gap-5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--textMuted)]">
              <span>
                <span className="font-mono text-[var(--text)]">
                  {String(photoCategories.length).padStart(2, "0")}
                </span>{" "}
                categories
              </span>
              <span className="h-3 w-px bg-[var(--border)]" aria-hidden />
              <span>
                <span className="font-mono text-[var(--text)]">
                  {String(totalEvents).padStart(2, "0")}
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
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <p className="max-w-xl text-[var(--textMuted)] prose-custom">
              Browse by category, then by event. Click any photo to open it full
              screen.
            </p>
            <a
              href={PHOTOGRAPHY_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-fit shrink-0 items-center gap-2 self-start border-b border-transparent pb-0.5 text-sm text-[var(--ice)] transition-colors hover:border-[var(--ice)]/50 sm:mt-0"
            >
              <Instagram
                className="h-4 w-4 opacity-90 transition-transform group-hover:scale-105"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="font-medium tracking-tight">@thomasw_300</span>
            </a>
          </div>
        </AnimatedBlock>

        <AnimatedBlock delay={0.05} className="mt-8">
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { href: "/photography/favorites", label: "Favorites", icon: Bookmark },
              { href: "/photography/account", label: "Account", icon: LogIn },
              { href: "/photography/packs", label: "Photo Packs", icon: Sparkles },
              { href: "/photography/stats", label: "Shot on", icon: Camera },
              { href: "/photography/book", label: "Book a session", icon: Calendar },
              { href: "/photography/unlimited", label: "Unlimited", icon: Sparkles },
              { href: "/feed/galleries.xml", label: "RSS", icon: Rss, external: true },
            ].map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5 text-[var(--textMuted)] transition-colors hover:text-[var(--ice)]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </AnimatedBlock>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {photoCategories.map((category, i) => {
            const photoCount = countPhotos(category);
            const firstEvent = category.events[0];
            const cover = firstEvent ? getCoverPhoto(firstEvent) : undefined;

            return (
              <AnimatedBlock
                key={category.slug}
                delay={0.05 * (i + 1)}
                className="flex"
              >
                <motion.li
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", bounce: 0.35 }}
                  className="group relative flex w-full"
                >
                  <Link
                    href={categoryPageHref(category.slug)}
                    className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 transition-all duration-300 ease-out hover:border-[var(--ice)]/40 hover:shadow-[0_20px_60px_-30px_rgba(125,211,252,0.45)]"
                  >
                    {/* Cover / placeholder */}
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
                          <div className="flex flex-col items-center gap-2 text-[var(--textMuted)]">
                            <Camera className="h-8 w-8 opacity-60" />
                            <span className="text-xs font-medium uppercase tracking-[0.16em]">
                              Coming soon
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Bottom gradient for legibility */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg2)] via-transparent to-transparent opacity-80" />
                      {/* Count chip */}
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur">
                        <ImageIcon className="h-3 w-3" />
                        {photoCount} {photoCount === 1 ? "photo" : "photos"}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-[var(--text)] transition-colors duration-300 group-hover:text-[var(--ice)] sm:text-xl">
                          {category.title}
                        </h2>
                        <ArrowRight className="h-4 w-4 text-[var(--textMuted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--ice)]" />
                      </div>
                      <p className="mt-1 text-sm text-[var(--textMuted)]">
                        {category.tagline}
                      </p>
                    </div>
                  </Link>
                </motion.li>
              </AnimatedBlock>
            );
          })}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <AnimatedBlock>
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-r from-[var(--bg3)]/80 via-[var(--bg2)]/75 to-[var(--bg3)]/70 p-6 sm:p-8">
            <div className="pointer-events-none absolute -top-16 right-0 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
                  Photo Packs
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                  Open mystery packs and collect exclusive premium poster drops.
                </h2>
              </div>
              <Button asChild className="w-fit">
                <Link href="/photography/packs">Open Packs</Link>
              </Button>
            </div>
          </div>
        </AnimatedBlock>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-2xl px-4 pb-24 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 text-center sm:p-8">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ice)]">
            Stay in the loop
          </span>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
            Get notified when new galleries drop
          </h2>
          <p className="mt-1 text-sm text-[var(--textMuted)]">
            One email when I publish. No spam, unsubscribe anytime.
          </p>
          <div className="mx-auto mt-5 max-w-md">
            <NewsletterForm compact />
          </div>
        </div>
      </section>
    </main>
  );
}

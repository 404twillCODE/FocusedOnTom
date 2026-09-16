"use client";

import Link from "next/link";
import { SocialLinks } from "@/components/SocialLinks";

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="container-page flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-[var(--text-muted)]">© 2026 Tom Williams</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-muted)]">
          <Link href="/explore" className="transition-colors hover:text-[var(--text)]">
            Explore NY
          </Link>
          <Link href="/websites" className="transition-colors hover:text-[var(--text)]">
            Websites
          </Link>
          <Link href="/about" className="transition-colors hover:text-[var(--text)]">
            About
          </Link>
          <span className="hidden text-[var(--text-muted)] sm:inline">
            Always curious. Always building.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <SocialLinks orientation="horizontal" showRail={false} />
          <a
            href="#top"
            className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
            BACK TO TOP ↑
          </a>
        </div>
      </div>
    </footer>
  );
}

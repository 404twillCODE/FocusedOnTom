"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export function WebsitesBanner() {
  return (
    <section className="py-8 sm:py-12">
      <div className="container-page">
        <Reveal>
          <Link
            href="/websites"
            className="group flex flex-col items-start justify-between gap-5 rounded-2xl border border-white/10 bg-[var(--bg3)]/50 px-6 py-7 transition-all duration-300 hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)]/15 sm:flex-row sm:items-center sm:px-8 sm:py-8"
          >
            <div>
              <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--accent-light)]">
                NEED A SITE?
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                I build custom websites
              </h2>
              <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)] sm:text-[15px]">
                Starter, business, and custom packages — from a clean one-pager
                to something built around your brand.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium tracking-[0.18em] text-[var(--accent-light)]">
              VIEW WEBSITES
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

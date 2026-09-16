"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { TextReveal } from "@/components/TextReveal";
import { easeExpo } from "@/lib/motion";

export function ContactCTA() {
  return (
    <section className="py-24 sm:py-28 lg:py-32">
      <div className="container-page">
        <Reveal scale y={48}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.45, ease: easeExpo }}
            className="relative overflow-hidden rounded-[24px] border border-white/10 px-6 py-16 text-center sm:px-10 sm:py-20"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,108,255,0.14),transparent_60%)]"
            />
            <p className="relative text-[11px] font-medium tracking-[0.24em] text-[var(--text-muted)]">
              HAVE SOMETHING INTERESTING IN MIND?
            </p>
            <TextReveal
              as="h2"
              mode="view"
              delay={0.08}
              className="relative mt-4 font-semibold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--text)]"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}
              lines={["Let's talk."]}
            />
            <Link
              href="/contact"
              className="group relative mt-8 inline-flex items-center gap-3 overflow-hidden rounded-full border border-white/20 px-6 py-3 text-xs font-medium tracking-[0.2em] text-[var(--text)] transition-all duration-300 hover:border-[var(--accent-light)] hover:bg-[var(--accent-soft)] hover:shadow-[0_0_34px_rgba(124,108,255,0.3)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(154,140,255,0.22),transparent)] transition-transform duration-700 group-hover:translate-x-full"
              />
              CONTACT ME
              <ArrowRight className="relative h-4 w-4 text-[var(--accent-light)] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

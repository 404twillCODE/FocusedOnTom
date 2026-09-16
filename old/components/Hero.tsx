"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { SocialLinks } from "@/components/SocialLinks";
import { TypingEffect } from "@/components/TypingEffect";
import { easeExpo, easeOut } from "@/lib/motion";

const typingPhrases = [
  "I build things for the web.",
  "I take photos that tell stories.",
  "I explore places whenever I can.",
  "Code, cameras, and curiosity.",
];

export function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 110]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, reduce ? 1 : 1.14]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 56]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.2]);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 18 });
  const glowX = useTransform(springX, [0, 1], ["15%", "85%"]);
  const glowY = useTransform(springY, [0, 1], ["20%", "80%"]);
  const glow = useMotionTemplate`radial-gradient(500px circle at ${glowX} ${glowY}, rgba(124,108,255,0.22), transparent 55%)`;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-36"
      onMouseMove={(e) => {
        if (reduce) return;
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />

      {/* subtle drifting orbs */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, 30, 0], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[var(--accent)]/10 blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, -40, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="container-page relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 xl:gap-20">
          <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 max-w-2xl min-w-0">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.05, ease: easeExpo }}
              className="text-sm font-medium tracking-wide text-[var(--accent-light)]"
            >
              Hi, I&apos;m Tom
            </motion.p>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.18, ease: easeExpo }}
              className="mt-4 font-semibold leading-[1.15] tracking-tight text-[var(--text)]"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.15rem)" }}
            >
              Computer science student with a love for photography, exploring,
              and building things.
            </motion.h1>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.4, ease: easeOut }}
              className="mt-6 min-h-[2.2em] text-lg sm:text-xl"
            >
              <TypingEffect
                phrases={typingPhrases}
                className="text-[var(--accent-light)]"
                cursorClassName="bg-[var(--accent)]"
                speed={55}
                pauseAtEnd={2200}
              />
            </motion.div>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.55, ease: easeOut }}
              className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--text-muted)] sm:text-base"
            >
              This is my corner of the web — projects I&apos;m shipping, photos
              I&apos;m proud of, and places I wander when I get outside.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 1.1, ease: easeOut }}
              className="mt-9"
            >
              <Link
                href="/projects"
                className="group relative inline-flex items-center gap-4 overflow-hidden rounded-full border border-white/20 bg-white/[0.02] py-1.5 pl-6 pr-1.5 text-[11px] font-medium tracking-[0.2em] text-[var(--text)] transition-all duration-300 hover:border-[var(--accent-light)] hover:bg-[var(--accent-soft)] hover:shadow-[0_0_34px_rgba(124,108,255,0.28)] sm:text-xs"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(154,140,255,0.22),transparent)] transition-transform duration-700 group-hover:translate-x-full"
                />
                SEE WHAT I&apos;M UP TO
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-transform duration-300 group-hover:translate-x-1 group-hover:border-[var(--accent)]/50">
                  <ArrowRight className="h-4 w-4 text-[var(--accent-light)]" />
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.25, duration: 0.6 }}
              className="mt-8 xl:hidden"
            >
              <SocialLinks orientation="horizontal" showRail={false} />
            </motion.div>
          </motion.div>

          <div className="relative">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(124,108,255,0.28),transparent_60%)] blur-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.9, scale: 1 }}
              transition={{ delay: 0.4, duration: 1.3, ease: easeExpo }}
            />

            <motion.div
              className="relative aspect-[5/6] overflow-hidden rounded-[22px] sm:aspect-[4/5] lg:aspect-[5/6] xl:min-h-[620px]"
              initial={
                reduce
                  ? false
                  : {
                      opacity: 0,
                      clipPath: "polygon(55% 0%, 55% 0%, 45% 100%, 45% 100%)",
                      scale: 1.08,
                    }
              }
              animate={{
                opacity: 1,
                clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)",
                scale: 1,
              }}
              transition={{ duration: 1.45, delay: 0.2, ease: easeExpo }}
            >
              <motion.div
                style={{ y: imageY, scale: imageScale }}
                className="absolute inset-[-12%]"
                initial={reduce ? false : { scale: 1.2, filter: "blur(12px)" }}
                animate={{ scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.6, delay: 0.25, ease: easeExpo }}
              >
                <Image
                  src="/images/hero/hero.jpg"
                  alt="Cinematic outdoor landscape"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover object-[center_30%]"
                />
              </motion.div>
              <div
                className="absolute inset-0 bg-gradient-to-t from-[rgba(7,17,26,0.55)] via-transparent to-[rgba(7,17,26,0.2)]"
                aria-hidden
              />
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.16)_48%,transparent_62%)]"
                initial={{ x: "-60%", opacity: 0 }}
                animate={{ x: "120%", opacity: [0, 1, 0] }}
                transition={{ duration: 1.4, delay: 1.1, ease: easeOut }}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" aria-hidden />
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.8, ease: easeOut }}
        className="pointer-events-auto absolute right-4 top-1/2 hidden -translate-y-1/2 xl:right-8 xl:block 2xl:right-12"
      >
        <SocialLinks />
      </motion.div>
    </section>
  );
}

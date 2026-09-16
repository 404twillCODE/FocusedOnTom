"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { TextReveal } from "@/components/TextReveal";
import { easeOut } from "@/lib/motion";

export function AboutPreview() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={ref} className="py-8 sm:py-12 lg:py-16">
      <div className="container-page">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-white/10 sm:aspect-[5/4] lg:aspect-[4/5]">
              <motion.div style={{ y: imageY }} className="absolute inset-[-10%]">
                <Image
                  src="/images/explore/about.jpg"
                  alt="Hiker looking out over a mountain landscape"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </motion.div>
              <div
                className="absolute inset-0 bg-gradient-to-t from-[rgba(7,17,26,0.45)] to-transparent"
                aria-hidden
              />
            </div>
          </Reveal>

          <Reveal delay={0.1} y={28}>
            <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent-light)]">
              ABOUT
            </p>
            <TextReveal
              as="h2"
              mode="view"
              delay={0.05}
              className="mt-3 font-semibold uppercase leading-[1.08] tracking-[-0.03em] text-[var(--text)]"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              lines={["A little", "about me."]}
            />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.2, ease: easeOut }}
              className="mt-5 h-px w-10 origin-left bg-[var(--accent)]"
              aria-hidden
            />
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--text-muted)] sm:text-base">
              I&apos;m Tom — a computer science student who likes being outdoors,
              taking photos, and building things on the web. This site is a
              simple place for the places I go, the shots I take, and the
              projects I ship.
            </p>
            <Link
              href="/about"
              className="group mt-8 inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-[var(--accent-light)] transition-colors hover:text-[var(--accent)]"
            >
              MORE ABOUT ME
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

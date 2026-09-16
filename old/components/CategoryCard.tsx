"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, Camera, Code2, Mountain } from "lucide-react";
import { useRef, useState } from "react";
import type { CategoryCardData } from "@/lib/data";
import { easeExpo, springSnappy } from "@/lib/motion";

const icons = {
  mountain: Mountain,
  camera: Camera,
  code: Code2,
};

type CategoryCardProps = {
  card: CategoryCardData;
};

export function CategoryCard({ card }: CategoryCardProps) {
  const Icon = icons[card.icon];
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 16, mass: 0.25 });
  const springY = useSpring(y, { stiffness: 200, damping: 16, mass: 0.25 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-12, 12]);
  const lift = useSpring(0, { stiffness: 220, damping: 20 });
  const glareX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(560px circle at ${glareX} ${glareY}, rgba(154,140,255,0.28), transparent 42%)`;

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onEnter() {
    setHovered(true);
    lift.set(-12);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
    setHovered(false);
    lift.set(0);
  }

  return (
    <div className="h-full [perspective:1400px]">
      <motion.div
        style={{ rotateX, rotateY, y: lift, transformStyle: "preserve-3d" }}
        className="h-full"
      >
        <Link
          ref={ref}
          href={card.href}
          onMouseMove={onMove}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className="group relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-[var(--bg3)] transition-[border-color,box-shadow] duration-500 hover:border-[var(--accent)]/45 hover:shadow-[0_36px_100px_-40px_rgba(124,108,255,0.65)] sm:min-h-[460px] lg:min-h-[500px]"
        >
          <motion.div
            className="absolute inset-0"
            animate={{ scale: hovered ? 1.12 : 1.02 }}
            transition={{ duration: 0.9, ease: easeExpo }}
          >
            <Image
              src={card.image}
              alt={card.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          </motion.div>

          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-[#07111a] via-[#07111a]/55 to-[#07111a]/10"
            animate={{ opacity: hovered ? 0.92 : 1 }}
            aria-hidden
          />
          <motion.div
            aria-hidden
            className="absolute inset-0"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ background: glare }}
          />

          {/* shine sweep */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.14)_48%,transparent_65%)]"
            initial={false}
            animate={{ x: hovered ? "120%" : "-80%", opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.75, ease: easeExpo }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-7">
            <div className="flex items-start justify-between">
              <motion.span
                animate={hovered ? { scale: 1.08, rotate: -6 } : { scale: 1, rotate: 0 }}
                transition={springSnappy}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--accent)]/45 bg-[rgba(7,17,26,0.45)] text-[var(--accent-light)] shadow-[0_0_24px_rgba(124,108,255,0.18)] backdrop-blur-sm"
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </motion.span>
              <motion.span
                animate={hovered ? { y: -2, color: "rgb(154,140,255)" } : { y: 0 }}
                className="font-mono text-[11px] tracking-[0.18em] text-white/35"
              >
                {card.number}
              </motion.span>
            </div>

            <div style={{ transform: "translateZ(36px)" }}>
              <h3 className="text-[1.35rem] font-semibold tracking-[0.12em] text-white uppercase sm:text-[1.55rem]">
                {card.title}
              </h3>
              <motion.div
                className="mt-3.5 h-px origin-left bg-[var(--accent)]"
                animate={{ width: hovered ? 56 : 36 }}
                transition={{ duration: 0.45, ease: easeExpo }}
                aria-hidden
              />
              <p className="mt-3.5 max-w-[18rem] text-[14px] leading-relaxed text-white/65">
                {card.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-[var(--accent-light)]">
                EXPLORE
                <motion.span animate={hovered ? { x: 4, y: -3 } : { x: 0, y: 0 }} transition={springSnappy}>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </motion.span>
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}

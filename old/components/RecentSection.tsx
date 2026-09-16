"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { TextReveal } from "@/components/TextReveal";
import { recentItems } from "@/lib/data";

export function RecentSection() {
  const [a, b, c, d] = recentItems;

  return (
    <section className="py-24 sm:py-28 lg:py-32">
      <div className="container-page">
        <Reveal y={24}>
          <div className="mb-10 sm:mb-14">
            <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent-light)]">
              RECENTLY
            </p>
            <TextReveal
              as="h2"
              mode="view"
              delay={0.05}
              className="mt-3 font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--text)]"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 3rem)" }}
              lines={["What I've been up to."]}
            />
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          <Reveal className="md:col-span-7" delay={0.04}>
            <RecentTile item={a} tall />
          </Reveal>
          <Reveal className="md:col-span-5" delay={0.1}>
            <RecentTile item={b} />
          </Reveal>
          <Reveal className="md:col-span-5" delay={0.14}>
            <RecentTile item={d} />
          </Reveal>
          <Reveal className="md:col-span-7" delay={0.18}>
            <RecentTile item={c} tall />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function RecentTile({
  item,
  tall = false,
}: {
  item: (typeof recentItems)[number];
  tall?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`group relative block overflow-hidden rounded-[18px] border border-white/10 ${
        tall ? "aspect-[16/11] md:aspect-[16/10]" : "aspect-[16/11] md:aspect-[4/3]"
      }`}
    >
      <Image
        src={item.image}
        alt={item.imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[rgba(7,17,26,0.92)] via-[rgba(7,17,26,0.25)] to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-300 group-hover:-translate-y-1 sm:p-6">
        <p className="text-[10px] font-medium tracking-[0.22em] text-[var(--accent-light)]">
          {item.tag.toUpperCase()}
        </p>
        <h3 className="mt-2 text-lg font-medium tracking-tight text-[var(--text)] sm:text-xl">
          {item.title}
        </h3>
      </div>
    </Link>
  );
}

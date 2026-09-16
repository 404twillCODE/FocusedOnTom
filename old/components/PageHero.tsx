"use client";

import { Reveal } from "@/components/Reveal";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
};

export function PageHero({ eyebrow, title, accent, description }: PageHeroProps) {
  return (
    <section className="pb-12 pt-28 sm:pb-16 sm:pt-32 lg:pt-36">
      <div className="container-page max-w-3xl">
        <Reveal>
          <p className="flex items-center gap-2.5 text-[11px] font-medium tracking-[0.24em] text-[var(--text-muted)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
            {eyebrow}
          </p>
          <h1
            className="mt-5 font-semibold uppercase tracking-[-0.03em] text-[var(--text)]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            {title}
            {accent ? (
              <>
                {" "}
                <span className="text-[var(--accent)]">{accent}</span>
              </>
            ) : null}
          </h1>
          <div className="mt-6 h-px w-12 bg-[var(--accent)]" aria-hidden />
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--text-muted)] sm:text-base">
            {description}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

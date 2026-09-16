import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description: "Who Tom is — CS student, photographer, explorer, builder.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="HELLO"
        title="I'm Tom"
        accent="Williams."
        description="Computer science student. Photographer. Someone who likes being outside and building things that feel intentional."
      />
      <section className="pb-28">
        <div className="container-page grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <div className="space-y-5 text-[15px] leading-relaxed text-[var(--text-muted)] sm:text-base">
              <p>
                This site is my corner of the internet — not a résumé, just a
                place for the things I actually care about: getting outside,
                taking photos, and coding.
              </p>
              <p>
                When I&apos;m not in class or in front of a screen, I&apos;m usually
                out exploring somewhere new, camping, or chasing a shot. When I
                am in front of a screen, I&apos;m building websites, apps, and
                little experiments.
              </p>
              <p>
                If something here resonates — a photo, a place, a project —
                feel free to reach out.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 pt-2 text-xs font-medium tracking-[0.2em] text-[var(--accent-light)] hover:text-[var(--accent)]"
              >
                GET IN TOUCH →
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-white/10">
              <Image
                src="/images/explore/about.jpg"
                alt="Outdoor scene representing exploration"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { loadEvent } from "@/lib/photography-source";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; event: string }>;
}): Promise<Metadata> {
  const { category: catRaw, event: evRaw } = await params;
  const match = await loadEvent(catRaw, evRaw);
  if (!match) {
    return { title: "Gallery" };
  }

  const { category: cat, event: ev } = match;
  const title = `${ev.title} (${cat.title})`;
  const parts = [
    ev.summary,
    ev.location ? `Location: ${ev.location}.` : null,
    `Photography by Tom Williams — Focused on Tom.`,
  ].filter(Boolean);
  const description =
    parts.join(" ").slice(0, 320) ||
    `Photos from ${ev.title} — ${cat.title} gallery on Focused on Tom.`;

  const path = `/photography/${encodeURIComponent(cat.slug)}/${encodeURIComponent(ev.slug)}`;
  const url = new URL(path, getSiteUrl()).toString();

  const ogImages = ev.cover
    ? [{ url: ev.cover, alt: ev.title }]
    : [{ url: "/logo.png", width: 512, height: 512, alt: "Focused on Tom" }];

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${ev.title} | Focused on Tom`,
      description,
      url,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${ev.title} | Focused on Tom`,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}

export default function PhotographyEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

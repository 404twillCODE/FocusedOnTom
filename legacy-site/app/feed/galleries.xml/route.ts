import { NextResponse } from "next/server";
import { eventPageHref } from "@/lib/photography";
import { loadPhotographyData } from "@/lib/photography-source";
import { PHOTO_BRAND } from "@/lib/photography-config";

export const revalidate = 3600;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS 2.0 feed of every public photography event. Most-recent first.
 * Exposed at /feed/galleries.xml.
 */
export async function GET() {
  const site = PHOTO_BRAND.siteUrl.replace(/\/$/, "");
  const items: string[] = [];

  type RssItem = {
    title: string;
    url: string;
    description: string;
    cover?: string;
    date: Date;
  };
  const all: RssItem[] = [];
  const { categories } = await loadPhotographyData();

  for (const cat of categories) {
    for (const ev of cat.events) {
      const date = ev.takenAt ? new Date(ev.takenAt) : new Date();
      const url = `${site}${eventPageHref(cat.slug, ev.slug)}`;
      const description = [ev.summary, ev.location, `${ev.photos.length} photos`]
        .filter(Boolean)
        .join(" · ");
      all.push({
        title: `${ev.title} — ${cat.title}`,
        url,
        description,
        cover: ev.cover,
        date,
      });
    }
  }

  all.sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const item of all.slice(0, 60)) {
    items.push(`    <item>
      <title>${esc(item.title)}</title>
      <link>${esc(item.url)}</link>
      <guid isPermaLink="true">${esc(item.url)}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <description>${esc(item.description)}</description>
      ${item.cover ? `<enclosure url="${esc(item.cover)}" type="image/webp" />` : ""}
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(PHOTO_BRAND.watermarkText)} — New galleries</title>
    <link>${esc(site)}/photography</link>
    <description>New photography galleries as they're published.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
    },
  });
}

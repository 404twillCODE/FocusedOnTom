import type { MetadataRoute } from "next";
import { categoryPageHref, eventPageHref } from "@/lib/photography";
import { loadPhotographyData } from "@/lib/photography-source";
import { absoluteUrl } from "@/lib/site-url";

const STATIC: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/photography", changeFrequency: "weekly", priority: 0.95 },
  { path: "/photography/book", changeFrequency: "monthly", priority: 0.9 },
  { path: "/photography/map", changeFrequency: "weekly", priority: 0.75 },
  { path: "/photography/stats", changeFrequency: "weekly", priority: 0.65 },
  { path: "/photography/favorites", changeFrequency: "monthly", priority: 0.5 },
  { path: "/photography/unlimited", changeFrequency: "monthly", priority: 0.55 },
  { path: "/photography/packs", changeFrequency: "weekly", priority: 0.65 },
  { path: "/photography/collection", changeFrequency: "weekly", priority: 0.65 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.85 },
  { path: "/skills", changeFrequency: "yearly", priority: 0.75 },
  { path: "/lifestyle", changeFrequency: "yearly", priority: 0.65 },
  { path: "/websites", changeFrequency: "monthly", priority: 0.8 },
  { path: "/websites/business", changeFrequency: "monthly", priority: 0.7 },
  { path: "/websites/custom", changeFrequency: "monthly", priority: 0.7 },
  { path: "/websites/starter", changeFrequency: "monthly", priority: 0.7 },
  { path: "/websites/payment", changeFrequency: "monthly", priority: 0.55 },
  { path: "/workout", changeFrequency: "monthly", priority: 0.55 },
  { path: "/workout/chat", changeFrequency: "monthly", priority: 0.45 },
  { path: "/focusedonyou", changeFrequency: "monthly", priority: 0.55 },
  { path: "/focusedonyou/get-started", changeFrequency: "monthly", priority: 0.45 },
  { path: "/feed/galleries.xml", changeFrequency: "daily", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const { categories } = await loadPhotographyData();

  const out: MetadataRoute.Sitemap = STATIC.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  }));

  for (const cat of categories) {
    out.push({
      url: absoluteUrl(categoryPageHref(cat.slug)),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.85,
    });
    for (const ev of cat.events) {
      out.push({
        url: absoluteUrl(eventPageHref(cat.slug, ev.slug)),
        lastModified,
        changeFrequency: "monthly",
        priority: 0.75,
      });
    }
  }

  return out;
}

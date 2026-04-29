import type { Metadata } from "next";
import { getCategory } from "@/lib/photography";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: raw } = await params;
  const cat = getCategory(raw);
  if (!cat) {
    return { title: "Photography" };
  }

  const title = `${cat.title} photos`;
  const description = cat.description
    ? `${cat.description} Browse galleries and buy prints on Focused on Tom.`
    : `Browse ${cat.title} photography by Tom Williams — cars, meets, landscapes, and more on Focused on Tom.`;

  const path = `/photography/${encodeURIComponent(cat.slug)}`;
  const url = new URL(path, getSiteUrl()).toString();

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${cat.title} | Focused on Tom`,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${cat.title} | Focused on Tom`,
      description,
    },
  };
}

export default function PhotographyCategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

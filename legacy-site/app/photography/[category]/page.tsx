import { notFound } from "next/navigation";
import { loadCategory } from "@/lib/photography-source";
import { CategoryView } from "./category-view.client";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = await loadCategory(categorySlug);
  if (!category) notFound();
  return <CategoryView category={category} />;
}

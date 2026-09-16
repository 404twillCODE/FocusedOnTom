import { loadPhotographyData } from "@/lib/photography-source";
import { PhotographyView } from "./photography-view.client";

export default async function PhotographyPage() {
  const { categories } = await loadPhotographyData();
  return <PhotographyView categories={categories} />;
}

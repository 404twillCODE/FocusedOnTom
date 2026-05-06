import { loadPhotographyData } from "@/lib/photography-source";
import type { Photo } from "@/lib/photography";
import { FavoritesView } from "./favorites-view.client";

export default async function FavoritesPage() {
  const { categories } = await loadPhotographyData();
  const allPhotos: Photo[] = [];
  for (const cat of categories) {
    for (const ev of cat.events) {
      for (const photo of ev.photos) {
        if (photo.id) allPhotos.push(photo);
      }
    }
  }
  return <FavoritesView allPhotos={allPhotos} />;
}

import { loadRecentPhotos } from "@/lib/photography-source";
import { HomeView } from "./home-view.client";

export default async function HomePage() {
  const recentPhotos = await loadRecentPhotos(3);
  return <HomeView recentPhotos={recentPhotos} />;
}

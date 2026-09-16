import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ExploreTease } from "@/components/explore/ExploreTease";
import { WebsitesBanner } from "@/components/WebsitesBanner";
import { RecentSection } from "@/components/RecentSection";
import { AboutPreview } from "@/components/AboutPreview";
import { ContactCTA } from "@/components/ContactCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <ExploreTease />
      <WebsitesBanner />
      <RecentSection />
      <AboutPreview />
      <ContactCTA />
    </>
  );
}

import { ExploreMapClient } from "@/components/explore/dynamic-maps";

export const dynamic = "force-dynamic";

export default function ExploreMapPage() {
  return (
    <section className="flex h-[calc(100svh-7.1rem)] min-h-[32rem] flex-col sm:h-[calc(100svh-7.6rem)]">
      <ExploreMapClient />
    </section>
  );
}

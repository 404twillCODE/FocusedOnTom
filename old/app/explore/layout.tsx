import type { Metadata } from "next";
import { ExploreSubnav } from "@/components/explore/ExploreSubnav";

export const metadata: Metadata = {
  title: "Explore New York",
  description:
    "Documenting New York one place at a time — parks, campsites, fire towers, trails, and trips.",
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col pt-[4.35rem] sm:pt-[4.85rem]">
      <ExploreSubnav />
      {children}
    </div>
  );
}

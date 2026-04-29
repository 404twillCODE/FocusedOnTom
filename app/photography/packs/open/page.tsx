import type { Metadata } from "next";
import { PackOpening } from "@/components/photography/packs/PackOpening";

export const metadata: Metadata = {
  title: "Open Photo Pack | Focused on Tom",
  description: "Reveal one random exclusive premium photo card.",
};

export default function PhotoPackOpenPage() {
  return <PackOpening />;
}

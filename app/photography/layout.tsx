import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photography — Focused on Tom",
  description: "A selection of photography — people, places, light.",
};

export default function PhotographyLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}

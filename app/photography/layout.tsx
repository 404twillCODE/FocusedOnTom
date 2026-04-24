import type { Metadata } from "next";
import { PhotographyUsageNotice } from "@/components/PhotographyUsageNotice";

export const metadata: Metadata = {
  title: "Photography | Focused on Tom",
  description: "A selection of photography — people, places, light.",
};

export default function PhotographyLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PhotographyUsageNotice />
    </>
  );
}

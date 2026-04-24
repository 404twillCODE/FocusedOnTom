import type { Metadata } from "next";
import { PhotographyUsageNotice } from "@/components/PhotographyUsageNotice";

export const metadata: Metadata = {
  title: "Photography | Focused on Tom",
  description: "Cars, landscapes, and the moments in between.",
  openGraph: {
    title: "Photography | Focused on Tom",
    description: "Cars, landscapes, and the moments in between.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Photography | Focused on Tom",
    description: "Cars, landscapes, and the moments in between.",
  },
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

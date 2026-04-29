import type { Metadata } from "next";
import { PhotographyUsageNotice } from "@/components/PhotographyUsageNotice";
import { PhotoProtectionGuards } from "@/components/photography/PhotoProtectionGuards";
import { getSiteUrl } from "@/lib/site-url";

const title = "Photography";
const description =
  "Car meets, automotive and rolling shots, landscapes, and street photography by Tom Williams (Focused on Tom). Browse galleries, book a session, and buy prints or licenses.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "car photography gallery",
    "automotive photography",
    "car meet photos",
    "book photographer",
    "Focused on Tom photography",
    "street photography",
    "landscape photography",
  ],
  alternates: { canonical: "/photography" },
  openGraph: {
    type: "website",
    url: new URL("/photography", getSiteUrl()).toString(),
    title: `${title} | Focused on Tom`,
    description,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Focused on Tom" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | Focused on Tom`,
    description,
    images: ["/logo.png"],
  },
};

export default function PhotographyLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <>
      <PhotoProtectionGuards />
      {children}
      <PhotographyUsageNotice />
    </>
  );
}

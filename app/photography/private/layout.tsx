import type { Metadata } from "next";

/** Client galleries are password-gated; keep them out of search indexes. */
export const metadata: Metadata = {
  title: "Private gallery",
  robots: { index: false, follow: false },
};

export default function PrivateGalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

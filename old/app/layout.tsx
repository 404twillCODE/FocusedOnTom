import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07111A",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://focusedontom.com"
  ),
  title: {
    default: "Focused on Tom",
    template: "%s | Focused on Tom",
  },
  description:
    "Tom Williams — exploring places, capturing photos, and building things on the web.",
  applicationName: "Focused on Tom",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Focused on Tom",
    description:
      "Tom Williams — exploring places, capturing photos, and building things on the web.",
    siteName: "Focused on Tom",
    images: [{ url: "/logo.png", width: 1000, height: 1000, alt: "Focused on Tom" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body id="top" className="min-h-full flex flex-col font-sans antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

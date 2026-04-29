import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/LayoutShell";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { getSiteUrl } from "@/lib/site-url";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const site = getSiteUrl();
const siteStr = site.toString();
const defaultTitle = "Focused on Tom | Photography & web development";
const defaultDescription =
  "Tom Williams — car and automotive photography, street and landscape galleries, web development, and side projects. Book a photography session or browse the portfolio.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: site,
  title: {
    default: defaultTitle,
    template: "%s | Focused on Tom",
  },
  description: defaultDescription,
  applicationName: "Focused on Tom",
  keywords: [
    "Tom Williams",
    "Focused on Tom",
    "car photography",
    "automotive photography",
    "car meet photographer",
    "rolling shots photographer",
    "book car photoshoot",
    "photography portfolio",
    "street photography",
    "landscape photography",
    "web developer",
    "Next.js developer",
    "portfolio",
  ],
  authors: [{ name: "Tom Williams", url: siteStr }],
  creator: "Tom Williams",
  publisher: "Tom Williams",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteStr,
    siteName: "Focused on Tom",
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Focused on Tom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "portfolio",
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cdn = process.env.NEXT_PUBLIC_CDN_URL?.trim();
  let cdnOrigin: string | null = null;
  if (cdn) {
    try {
      cdnOrigin = new URL(cdn).origin;
    } catch {
      cdnOrigin = null;
    }
  }

  return (
    <html lang="en" className="dark">
      <head>
        <SeoJsonLd />
        <link rel="preconnect" href="https://formspree.io" />
        <link rel="dns-prefetch" href="https://formspree.io" />
        {cdnOrigin ? (
          <>
            <link rel="preconnect" href={cdnOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={cdnOrigin} />
          </>
        ) : null}
      </head>
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}

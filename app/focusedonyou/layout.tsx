import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "FocusedOnYou | Focused on Tom",
    template: "%s | FocusedOnYou",
  },
  description:
    "Simple workout logging — track sets, rest timers, and progress without the clutter.",
  alternates: {
    canonical: "/focusedonyou",
  },
  openGraph: {
    title: "FocusedOnYou | Focused on Tom",
    description:
      "Simple workout logging — track sets, rest timers, and progress without the clutter.",
    url: "/focusedonyou",
    siteName: "Focused on Tom",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusedOnYou | Focused on Tom",
    description:
      "Simple workout logging — track sets, rest timers, and progress without the clutter.",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function FocusedOnYouRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

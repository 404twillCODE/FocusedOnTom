import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TransitionProvider } from "@/components/transition/TransitionContext";
import { RouteTransitionWrapper } from "@/components/transition/RouteTransitionWrapper";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FocusedOnTom",
  description: "Premium cinematic portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${geistMono.variable} antialiased`}
      >
        <TransitionProvider>
          <RouteTransitionWrapper>{children}</RouteTransitionWrapper>
        </TransitionProvider>
      </body>
    </html>
  );
}

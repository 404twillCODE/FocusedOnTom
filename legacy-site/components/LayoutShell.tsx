"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";

const TEMPLATE_PATHS = ["/websites/starter", "/websites/business", "/websites/custom"];

const Background = dynamic(() => import("@/components/Background").then((m) => ({ default: m.Background })), {
  ssr: true,
  loading: () => (
    <div
      className="fixed inset-0 -z-10"
      style={{
        background: "linear-gradient(180deg, var(--bg) 0%, var(--bg2) 50%, var(--bg3) 100%)",
      }}
      aria-hidden
    />
  ),
});

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTemplate = TEMPLATE_PATHS.some((p) => pathname === p);

  if (isTemplate) {
    return <>{children}</>;
  }

  return (
    <>
      <Background />
      <Nav />
      <div className="min-h-screen pt-16 sm:pt-20">{children}</div>
    </>
  );
}

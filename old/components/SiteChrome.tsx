"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const HIDE_CHROME = [
  "/websites/starter",
  "/websites/business",
  "/websites/custom",
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = HIDE_CHROME.some((p) => pathname === p);
  const hideFooter = pathname === "/explore";

  if (hide) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      {hideFooter ? null : <Footer />}
    </>
  );
}

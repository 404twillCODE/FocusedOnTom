"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { PageTransition } from "@/components/motion/PageTransition";
import { useSetTransitioning } from "./TransitionContext";

const TRANSITION_DURATION_MS = 700;

type Section = "home" | "lab" | "lifestyle" | "default";

function getSection(pathname: string): Section {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/lab")) return "lab";
  if (pathname.startsWith("/lifestyle")) return "lifestyle";
  return "default";
}

const SECTION_GRADIENTS: Record<Section, string> = {
  home: "linear-gradient(180deg, #050812 0%, #0a1426 50%, #080d18 100%)",
  lab: "linear-gradient(180deg, #060b14 0%, #0d1628 40%, #0a1222 100%)",
  lifestyle: "linear-gradient(180deg, #0a0d14 0%, #141820 40%, #16121a 100%)",
  default: "linear-gradient(180deg, #050812 0%, #0a1426 100%)",
};

export function RouteTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setTransitioning = useSetTransitioning();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setTransitioning(true);
      const t = setTimeout(() => setTransitioning(false), TRANSITION_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [pathname, setTransitioning]);

  const section = getSection(pathname);
  const gradient = SECTION_GRADIENTS[section];

  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-[background] duration-700 ease-out"
        style={{ background: gradient }}
        aria-hidden
      />
      <PageTransition key={pathname} className="relative z-10 min-h-screen">
        {children}
      </PageTransition>
    </>
  );
}

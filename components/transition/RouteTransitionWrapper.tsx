"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { PageTransition } from "@/components/motion/PageTransition";
import { useSetTransitioning } from "./TransitionContext";
import { isUniverseRoute, isLenisRoute } from "@/lib/routes";
import { UniverseMount } from "@/components/universe/UniverseMount";
import { LenisProvider } from "@/components/cinematic/LenisProvider";
import { useAppStore, type AppState } from "@/store/appStore";

const TRANSITION_DURATION_MS = 700;

type Section = "home" | "skills" | "lab" | "lifestyle" | "default";

function getSection(pathname: string): Section {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/skills")) return "skills";
  if (pathname.startsWith("/lab")) return "lab";
  if (pathname.startsWith("/lifestyle")) return "lifestyle";
  return "default";
}

const SECTION_GRADIENTS: Record<Section, string> = {
  home: "linear-gradient(180deg, #050812 0%, #0a1426 50%, #080d18 100%)",
  skills: "linear-gradient(180deg, #060a14 0%, #0c1428 40%, #0a1224 100%)",
  lab: "linear-gradient(180deg, #060b14 0%, #0d1628 40%, #0a1222 100%)",
  lifestyle: "linear-gradient(180deg, #0a0d14 0%, #141820 40%, #16121a 100%)",
  default: "linear-gradient(180deg, #050812 0%, #0a1426 100%)",
};

const GRAIN_OFF_CLASS = "grain-off";

/** Syncs grain preference to body class: off when grain disabled or reduced motion. */
function GrainGuard() {
  const grainEnabled = useAppStore((s: AppState) => s.grainEnabled);
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);
  const grainOff = !grainEnabled || reducedMotion;

  useEffect(() => {
    if (grainOff) {
      document.body.classList.add(GRAIN_OFF_CLASS);
    } else {
      document.body.classList.remove(GRAIN_OFF_CLASS);
    }
    return () => document.body.classList.remove(GRAIN_OFF_CLASS);
  }, [grainOff]);
  return null;
}

export function RouteTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setTransitioning = useSetTransitioning();
  const prevPathname = useRef(pathname);
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);
  const showUniverse = isUniverseRoute(pathname ?? "");
  const lenisActive = isLenisRoute(pathname ?? "") && !reducedMotion;

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

  const section = getSection(pathname ?? "");
  const gradient = SECTION_GRADIENTS[section];

  return (
    <>
      <GrainGuard />
      {showUniverse && (
        <div className="fixed inset-0 z-0">
          <UniverseMount className="h-full w-full" />
        </div>
      )}
      <div
        className="fixed inset-0 z-[1] pointer-events-none transition-[background] duration-700 ease-out"
        style={{
          background: gradient,
          opacity: showUniverse ? 0.58 : 1,
        }}
        aria-hidden
      />
      <LenisProvider active={lenisActive}>
        <PageTransition key={pathname} className="relative z-10 min-h-screen">
          {children}
        </PageTransition>
      </LenisProvider>
    </>
  );
}

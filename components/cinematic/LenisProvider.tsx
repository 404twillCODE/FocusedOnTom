"use client";

import { useEffect, useRef } from "react";

interface LenisProviderProps {
  active: boolean;
  children: React.ReactNode;
}

export function LenisProvider({ active, children }: LenisProviderProps) {
  const lenisRef = useRef<InstanceType<typeof import("@studio-freight/lenis").default> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    let mounted = true;

    import("@studio-freight/lenis").then(({ default: Lenis }) => {
      if (!mounted) return;
      const lenis = new Lenis({ lerp: 0.08 });
      lenisRef.current = lenis;

      function raf(time: number) {
        if (!mounted || !lenisRef.current) return;
        lenisRef.current.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      }
      rafRef.current = requestAnimationFrame(raf);
    });

    return () => {
      mounted = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [active]);

  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { FadeIn } from "@/components/motion/FadeIn";
import { Heading } from "@/components/ui/Heading";
import { BootSequence } from "@/components/cinematic/BootSequence";
import { useAppStore, type AppState } from "@/store/appStore";
import { determineQualityTier } from "@/lib/perf/quality";
import { getPrefersReducedMotion } from "@/lib/perf/reducedMotion";

export function HomeClient() {
  const [introComplete, setIntroComplete] = useState(false);
  const [ready, setReady] = useState(false);

  const hasVisited = useAppStore((s: AppState) => s.hasVisited);
  const setHasVisited = useAppStore((s: AppState) => s.setHasVisited);
  const setQualityTier = useAppStore((s: AppState) => s.setQualityTier);
  const qualityMode = useAppStore((s: AppState) => s.qualityMode);
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);
  const setReducedMotion = useAppStore((s: AppState) => s.setReducedMotion);

  useEffect(() => {
    setReducedMotion(getPrefersReducedMotion());
    setReady(true);
  }, [setReducedMotion]);

  useEffect(() => {
    if (qualityMode !== "auto") return;
    determineQualityTier().then(setQualityTier);
  }, [qualityMode, setQualityTier]);

  const handleIntroComplete = () => {
    setIntroComplete(true);
    setHasVisited(true);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg" aria-busy="true" aria-label="Loading" />
    );
  }

  return (
    <>
      {!introComplete && (
        <BootSequence
          isReturnVisit={hasVisited}
          reducedMotion={reducedMotion}
          onComplete={handleIntroComplete}
        />
      )}
      <div className="relative min-h-screen">
        <div className="relative z-10">
          <AppShell>
            <section className="mx-auto max-w-6xl space-y-8 px-4 py-12">
              <FadeIn>
                <Heading as="h1">FocusedOnTom</Heading>
              </FadeIn>
              <FadeIn delay={0.1}>
                <p className="max-w-xl text-lg text-textMuted">
                  Cinematic portfolio. Projects, lab, and more.
                </p>
              </FadeIn>
            </section>
          </AppShell>
        </div>
      </div>
    </>
  );
}

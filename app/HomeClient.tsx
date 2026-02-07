"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { UniverseMount } from "@/components/universe/UniverseMount";
import { Heading } from "@/components/ui/Heading";
import { BootSequence } from "@/components/cinematic/BootSequence";
import { LenisProvider } from "@/components/cinematic/LenisProvider";
import { useAppStore } from "@/store/appStore";
import { determineQualityTier } from "@/lib/perf/quality";
import { getPrefersReducedMotion } from "@/lib/perf/reducedMotion";

export function HomeClient() {
  const [introComplete, setIntroComplete] = useState(false);
  const [ready, setReady] = useState(false);

  const hasVisited = useAppStore((s) => s.hasVisited);
  const setHasVisited = useAppStore((s) => s.setHasVisited);
  const setQualityTier = useAppStore((s) => s.setQualityTier);
  const qualityMode = useAppStore((s) => s.qualityMode);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);

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
      <LenisProvider active={introComplete && !reducedMotion}>
        <div className="relative min-h-screen">
          {introComplete && (
            <div className="fixed inset-0 z-0">
              <UniverseMount className="h-full w-full" />
            </div>
          )}
          <div className="relative z-10">
            <AppShell>
              <PageTransition className="mx-auto max-w-6xl px-4 py-12">
                <section className="space-y-8">
                  <FadeIn>
                    <Heading as="h1">FocusedOnTom</Heading>
                  </FadeIn>
                  <FadeIn delay={0.1}>
                    <p className="max-w-xl text-lg text-textMuted">
                      Cinematic portfolio. Projects, lab, and more.
                    </p>
                  </FadeIn>
                </section>
              </PageTransition>
            </AppShell>
          </div>
        </div>
      </LenisProvider>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { photoPackCards } from "@/src/data/photo-pack-cards";
import { pickPackCard, savePulledCard, type PullResult } from "@/lib/photo-packs";
import { PhotoPackCard } from "@/components/photography/packs/PhotoPackCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type Stage = "idle" | "opening" | "revealed";

const rarityGlowMap = {
  Standard: "shadow-[0_0_55px_rgba(255,255,255,0.35)]",
  Rare: "shadow-[0_0_70px_rgba(34,211,238,0.4)]",
  Epic: "shadow-[0_0_85px_rgba(139,92,246,0.45)]",
  Signature: "shadow-[0_0_110px_rgba(251,191,36,0.6)]",
} as const;

const UNLIMITED_REROLL_EMAIL = "twj2390@gmail.com";

export function PackOpening() {
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<PullResult | null>(null);
  const [flashVisible, setFlashVisible] = useState(false);
  const [canUnlimitedReroll, setCanUnlimitedReroll] = useState(false);

  const eligibleCount = useMemo(
    () => photoPackCards.filter((card) => card.isPackEligible).length,
    []
  );

  useEffect(() => {
    let mounted = true;
    const updateFromSession = async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email?.toLowerCase().trim();
      if (!mounted) return;
      setCanUnlimitedReroll(email === UNLIMITED_REROLL_EMAIL);
    };

    void updateFromSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void updateFromSession();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function handleOpenPack() {
    if (stage === "opening") return;

    const card = pickPackCard(photoPackCards);
    if (!card) return;

    setStage("opening");
    setResult(null);

    window.setTimeout(() => setFlashVisible(true), 850);
    window.setTimeout(() => setFlashVisible(false), 1120);
    window.setTimeout(() => {
      const storage = savePulledCard(card.id);
      setResult({
        card,
        isDuplicate: storage.isDuplicate,
        duplicateCount: storage.duplicateCount,
      });
      setStage("revealed");
    }, 1450);
  }

  function handleReset() {
    setStage("idle");
    setResult(null);
    setFlashVisible(false);
  }

  function handleReroll() {
    handleReset();
    window.setTimeout(() => handleOpenPack(), 80);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Photo Packs</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Open your premium card reveal
        </h1>
        <p className="mt-3 text-white/65">
          Tap the sealed pack and reveal one exclusive collectible card.
        </p>
      </div>

      <div className="relative mx-auto mt-12 flex min-h-[560px] max-w-2xl items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a1627] to-[#050912] p-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute left-[35%] top-[65%] h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        <AnimatePresence>
          {flashVisible ? (
            <motion.div
              className="pointer-events-none absolute inset-0 z-30 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            />
          ) : null}
        </AnimatePresence>

        {stage !== "revealed" ? (
          <motion.button
            type="button"
            onClick={handleOpenPack}
            whileHover={{ scale: 1.03 }}
            animate={
              stage === "opening"
                ? {
                    rotate: [0, -7, 6, -4, 4, 0],
                    scale: [1, 1.06, 0.98, 1],
                  }
                : { y: [0, -8, 0] }
            }
            transition={
              stage === "opening"
                ? { duration: 0.75, ease: "easeInOut" }
                : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            }
            className="relative z-10 w-full max-w-sm rounded-3xl border border-cyan-300/35 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-10 text-left backdrop-blur-xl"
          >
            <div className="absolute inset-0 rounded-3xl border border-cyan-200/20 shadow-[0_0_80px_rgba(34,211,238,0.3)]" />
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Sealed Pack</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">FocusedOnTom Photo Pack</h2>
            <p className="mt-3 text-sm text-white/70">
              Includes one random premium collectible card. {eligibleCount} eligible cards available.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-white">
              {stage === "opening" ? "Opening..." : "Open Pack"}
            </div>
          </motion.button>
        ) : null}

        <AnimatePresence>
          {stage === "revealed" && result ? (
            <motion.div
              key={result.card.id}
              className="relative z-20 w-full max-w-sm"
              initial={{ rotateY: 180, scale: 0.92, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={`absolute inset-8 rounded-full blur-3xl ${rarityGlowMap[result.card.rarity]}`}
                aria-hidden
              />
              <PhotoPackCard card={result.card} className="relative z-10" />
              <div className="mt-4 text-center">
                {result.isDuplicate ? (
                  <p className="text-sm font-medium text-amber-200">
                    Duplicate Pull - total duplicates: {result.duplicateCount}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-cyan-100">New card added to your collection</p>
                )}
                {canUnlimitedReroll ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-cyan-100/80">
                    Unlimited reroll enabled for {UNLIMITED_REROLL_EMAIL}
                  </p>
                ) : null}
                <div className="mt-4 flex justify-center gap-3">
                  <Button onClick={handleReset}>Open Another Pack</Button>
                  {canUnlimitedReroll ? (
                    <Button onClick={handleReroll}>Reroll</Button>
                  ) : null}
                  <Button asChild>
                    <Link href="/photography/collection">View Collection</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

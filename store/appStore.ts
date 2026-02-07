import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QualityTier } from "@/lib/types/content";

export type QualityMode = "auto" | "high" | "medium" | "low";
export type ExploreMode = "guided" | "free";

export interface AppState {
  hasVisited: boolean;
  qualityTier: QualityTier;
  qualityMode: QualityMode;
  /** Saved quality when perf mode is on; restored when perf off. */
  previousQualityMode: QualityMode | null;
  reducedMotion: boolean;
  terminalOpen: boolean;
  exploreMode: ExploreMode;
  devMode: boolean;
  setHasVisited: (visited: boolean) => void;
  setQualityTier: (tier: QualityTier) => void;
  setQualityMode: (mode: QualityMode) => void;
  /** Turn on reduced-visuals (low) and save current quality to restore later. */
  setPerfOn: () => void;
  /** Restore quality to the value saved when perf was turned on. */
  setPerfOff: () => void;
  setReducedMotion: (value: boolean) => void;
  setTerminalOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  setExploreMode: (mode: ExploreMode) => void;
  setDevMode: (value: boolean) => void;
  getQualityMode: () => QualityMode;
}

const STORAGE_KEY = "focusedontom-app";

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasVisited: false,
      qualityTier: 2,
      qualityMode: "auto",
      previousQualityMode: null,
      reducedMotion: false,
      terminalOpen: false,
      exploreMode: "guided",
      devMode: false,
      setHasVisited: (visited) => set({ hasVisited: visited }),
      setQualityTier: (tier) => set({ qualityTier: tier }),
      setQualityMode: (mode) =>
        set((s) => ({
          qualityMode: mode,
          previousQualityMode: s.previousQualityMode,
          qualityTier:
            mode === "auto"
              ? s.qualityTier
              : mode === "high"
                ? 3
                : mode === "medium"
                  ? 2
                  : 1,
        })),
      setPerfOn: () =>
        set((s) => ({
          previousQualityMode: s.qualityMode,
          qualityMode: "low",
          qualityTier: 1,
        })),
      setPerfOff: () =>
        set((s) => {
          const restore = s.previousQualityMode ?? "auto";
          const tier =
            restore === "auto"
              ? 2
              : restore === "high"
                ? 3
                : restore === "medium"
                  ? 2
                  : 1;
          return {
            qualityMode: restore,
            previousQualityMode: null,
            qualityTier: tier,
          };
        }),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setTerminalOpen: (open) => set({ terminalOpen: open }),
      toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),
      setExploreMode: (mode) => set({ exploreMode: mode }),
      setDevMode: (value) => set({ devMode: value }),
      getQualityMode: () => get().qualityMode,
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        hasVisited: s.hasVisited,
        qualityMode: s.qualityMode,
        previousQualityMode: s.previousQualityMode,
      }),
    }
  )
);

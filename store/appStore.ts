import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QualityTier } from "@/lib/types/content";

export type QualityMode = "auto" | "high" | "medium" | "low";
export type ExploreMode = "guided" | "free";

interface AppState {
  hasVisited: boolean;
  qualityTier: QualityTier;
  qualityMode: QualityMode;
  reducedMotion: boolean;
  terminalOpen: boolean;
  exploreMode: ExploreMode;
  devMode: boolean;
  setHasVisited: (visited: boolean) => void;
  setQualityTier: (tier: QualityTier) => void;
  setQualityMode: (mode: QualityMode) => void;
  setReducedMotion: (value: boolean) => void;
  setTerminalOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  setExploreMode: (mode: ExploreMode) => void;
  setDevMode: (value: boolean) => void;
}

const STORAGE_KEY = "focusedontom-app";

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasVisited: false,
      qualityTier: 2,
      qualityMode: "auto",
      reducedMotion: false,
      terminalOpen: false,
      exploreMode: "guided",
      devMode: false,
      setHasVisited: (visited) => set({ hasVisited: visited }),
      setQualityTier: (tier) => set({ qualityTier: tier }),
      setQualityMode: (mode) =>
        set((s) => ({
          qualityMode: mode,
          qualityTier:
            mode === "auto"
              ? s.qualityTier
              : mode === "high"
                ? 3
                : mode === "medium"
                  ? 2
                  : 1,
        })),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setTerminalOpen: (open) => set({ terminalOpen: open }),
      toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),
      setExploreMode: (mode) => set({ exploreMode: mode }),
      setDevMode: (value) => set({ devMode: value }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ hasVisited: s.hasVisited, qualityMode: s.qualityMode }),
    }
  )
);

import { create } from "zustand";

export interface AppState {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  reducedMotion: false,
  setReducedMotion: (value) => set({ reducedMotion: value }),
}));

"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface TransitionContextValue {
  isTransitioning: boolean;
  setTransitioning: (value: boolean) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setTransitioning] = useState(false);
  const value: TransitionContextValue = {
    isTransitioning,
    setTransitioning: useCallback((v: boolean) => setTransitioning(v), []),
  };
  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransitioning(): boolean {
  const ctx = useContext(TransitionContext);
  return ctx?.isTransitioning ?? false;
}

export function useSetTransitioning(): (value: boolean) => void {
  const ctx = useContext(TransitionContext);
  return ctx?.setTransitioning ?? (() => {});
}

"use client";

import { useState, useEffect, useCallback } from "react";

export type RestTimerState = {
  visible: boolean;
  secondsLeft: number;
  start: (initialSeconds: number) => void;
  dismiss: () => void;
};

/** Rest timer countdown. start(seconds) shows and begins countdown; dismiss hides. */
export function useRestTimer(): RestTimerState {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const start = useCallback((initialSeconds: number) => {
    setSecondsLeft(initialSeconds);
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    if (!visible || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [visible, secondsLeft]);

  return { visible, secondsLeft, start, dismiss };
}

export function formatRestTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

"use client";

import { useEffect, useState } from "react";
import { WifiOff, Cloud, Check } from "lucide-react";
import { subscribeToSyncStatus } from "@/lib/offline/sync";

type Status = "offline" | "syncing" | "saved";

export function FOYSyncStatus() {
  const [status, setStatus] = useState<Status>("saved");
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    const unsub = subscribeToSyncStatus((s, length) => {
      setStatus(s);
      setQueueLength(length);
    });
    return unsub;
  }, []);

  if (status === "offline") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
        title="Changes will sync when you're back online."
      >
        <WifiOff className="h-3.5 w-3.5" aria-hidden />
        Offline — changes will sync later
      </span>
    );
  }

  if (status === "syncing" && queueLength > 0) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--iceSoft)] px-2.5 py-1 text-xs font-medium text-[var(--ice)]"
        title="Syncing your changes…"
      >
        <Cloud className="h-3.5 w-3.5 animate-pulse" aria-hidden />
        Syncing…
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg3)]/80 px-2.5 py-1 text-xs text-[var(--textMuted)]"
      title="All changes saved"
    >
      <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
      All changes saved
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initDB } from "@/lib/offline/db";
import { getActiveSession, getLocalSessionDetails } from "@/lib/offline/logging";
import type { LocalSession } from "@/lib/offline/types";
import { FOYActiveSessionModal } from "./FOYActiveSessionModal";

export function FOYActiveSessionRecovery() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<{
    session: LocalSession;
    workoutName: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDB();
        const session = await getActiveSession();
        if (cancelled || !session) return;
        const isOnLiveForThisSession =
          pathname === "/focusedonyou/log/live" &&
          searchParams.get("sessionId") === session.id;
        if (isOnLiveForThisSession) return;
        const details = await getLocalSessionDetails(session.id);
        if (cancelled) return;
        setActive({
          session,
          workoutName: details?.workoutName ?? null,
        });
      } catch {
        // Ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  if (!active) return null;

  return (
    <FOYActiveSessionModal
      session={active.session}
      workoutName={active.workoutName}
      onDismiss={() => setActive(null)}
    />
  );
}

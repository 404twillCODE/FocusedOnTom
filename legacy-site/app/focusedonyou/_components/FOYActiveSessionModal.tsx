"use client";

import { useRouter } from "next/navigation";
import { FOYButton } from "./FOYButton";
import { FOYCard } from "./FOYCard";
import type { LocalSession } from "@/lib/offline/types";
import * as logging from "@/lib/offline/logging";

type Props = {
  session: LocalSession;
  workoutName: string | null;
  onDismiss: () => void;
};

export function FOYActiveSessionModal({
  session,
  workoutName,
  onDismiss,
}: Props) {
  const router = useRouter();

  async function handleResume() {
    onDismiss();
    router.push(`/focusedonyou/log/live?sessionId=${session.id}`);
  }

  async function handleDiscard() {
    await logging.endSessionLocal(session.id);
    onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="foy-recovery-title"
      aria-describedby="foy-recovery-desc"
    >
      <FOYCard className="w-full max-w-sm p-6">
        <h2
          id="foy-recovery-title"
          className="text-lg font-semibold text-[var(--text)]"
        >
          Resume your session?
        </h2>
        <p id="foy-recovery-desc" className="mt-2 text-sm text-[var(--textMuted)]">
          You have an active workout
          {workoutName ? ` (${workoutName})` : ""}. Resume or discard it.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <FOYButton variant="secondary" onClick={handleDiscard} className="min-h-12">
            Discard
          </FOYButton>
          <FOYButton variant="primary" onClick={handleResume} className="min-h-12">
            Resume
          </FOYButton>
        </div>
      </FOYCard>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { FOYCard } from "@/app/focusedonyou/_components";
import type { ProgressPR } from "@/lib/supabase/foyProgress";

export function ProgressPRs({ prs }: { prs: ProgressPR[] }) {
  if (prs.length === 0) {
    return (
      <FOYCard className="py-6 text-center">
        <p className="text-sm text-[var(--textMuted)]">No PRs yet. Log sets with weight to see them.</p>
      </FOYCard>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {prs.map((pr, i) => (
        <motion.li
          key={`${pr.exercise_name}-${pr.weight}-${i}`}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.04 }}
        >
          <FOYCard className="flex items-center gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--iceSoft)] text-[var(--ice)]">
              <Trophy className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--text)]">{pr.exercise_name}</p>
              <p className="text-xs text-[var(--textMuted)]">
                {pr.weight} {pr.reps != null ? `× ${pr.reps} reps` : ""}
                {pr.date ? ` · ${pr.date}` : ""}
              </p>
            </div>
            <p className="shrink-0 text-lg font-semibold tabular-nums text-[var(--ice)]">
              {pr.weight}
            </p>
          </FOYCard>
        </motion.li>
      ))}
    </ul>
  );
}

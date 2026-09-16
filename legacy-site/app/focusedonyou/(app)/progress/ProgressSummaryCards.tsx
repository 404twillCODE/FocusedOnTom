"use client";

import { motion } from "framer-motion";
import { FOYCard } from "@/app/focusedonyou/_components";
import type { ProgressSummary } from "@/lib/supabase/foyProgress";

function formatVolume(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function ProgressSummaryCards({ data }: { data: ProgressSummary }) {
  const cards = [
    { label: "Workouts this week", value: String(data.workoutCount) },
    { label: "Sets this week", value: String(data.setCount) },
    { label: "Volume (est.)", value: formatVolume(data.volume) },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
        >
          <FOYCard className="py-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-[var(--ice)]">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-[var(--textMuted)]">{card.label}</p>
          </FOYCard>
        </motion.div>
      ))}
    </div>
  );
}

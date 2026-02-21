"use client";

import { motion } from "framer-motion";
import { FOYCard } from "@/app/focusedonyou/_components";
import type { DayActivity } from "@/lib/supabase/foyProgress";

type Props = {
  days: DayActivity[];
  metric: "workoutCount" | "volume";
};

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
}

export function ProgressChart({ days, metric }: Props) {
  const values = days.map((d) => d[metric]);
  const max = Math.max(1, ...values);

  return (
    <FOYCard className="overflow-hidden">
      <p className="mb-3 text-sm font-medium text-[var(--text)]">
        Last 14 days · {metric === "workoutCount" ? "Workouts" : "Volume"}
      </p>
      <div className="flex items-end justify-between gap-1" style={{ height: 96 }}>
        {days.map((day, i) => {
          const pct = max > 0 ? (day[metric] / max) * 100 : 0;
          return (
            <motion.div
              key={day.date}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(pct, 0)}%` }}
              transition={{ duration: 0.35, delay: i * 0.02 }}
              className="flex flex-1 flex-col items-center justify-end"
            >
              <div
                className="w-full min-w-[6px] max-w-[20px] rounded-t bg-[var(--ice)]/70"
                style={{ height: "100%", minHeight: day[metric] > 0 ? 4 : 0 }}
              />
              <span className="mt-1 text-[10px] text-[var(--textMuted)]">
                {formatDayLabel(day.date)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </FOYCard>
  );
}

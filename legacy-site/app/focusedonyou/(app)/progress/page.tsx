"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Loader2, TrendingUp } from "lucide-react";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import {
  getProgressSummary,
  getTopPRs,
  getLast14DaysActivity,
  type ProgressSummary as ProgressSummaryType,
  type ProgressPR,
  type DayActivity,
} from "@/lib/supabase/foyProgress";
import {
  FOYContainer,
  FOYEmptyState,
  FOYButton,
  FOYButtonLink,
} from "@/app/focusedonyou/_components";
import { ProgressSummaryCards } from "./ProgressSummaryCards";
import { ProgressPRs } from "./ProgressPRs";
import { ProgressChart } from "./ProgressChart";

export default function ProgressPage() {
  const [summary, setSummary] = useState<ProgressSummaryType | null>(null);
  const [prs, setPrs] = useState<ProgressPR[]>([]);
  const [days, setDays] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartMetric, setChartMetric] = useState<"workoutCount" | "volume">("workoutCount");

  const loadProgress = useCallback(() => {
    setError("");
    setLoading(true);
    const supabase = getFOYSupabase();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      Promise.all([
        getProgressSummary(supabase, user.id),
        getTopPRs(supabase, user.id, 5),
        getLast14DaysActivity(supabase, user.id),
      ])
        .then(([s, p, d]) => {
          setSummary(s);
          setPrs(p);
          setDays(d);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Could not load progress."))
        .finally(() => setLoading(false));
    });
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  if (loading) {
    return (
      <FOYContainer className="py-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" aria-hidden />
        </div>
      </FOYContainer>
    );
  }

  if (error) {
    return (
      <FOYContainer className="py-8">
        <p className="text-[var(--textMuted)]">{error}</p>
        <FOYButton variant="secondary" className="mt-4" onClick={() => loadProgress()}>
          Try again
        </FOYButton>
      </FOYContainer>
    );
  }

  const hasData = (summary && (summary.workoutCount > 0 || summary.setCount > 0)) || prs.length > 0 || days.some((d) => d.workoutCount > 0 || d.volume > 0);

  if (!hasData) {
    return (
      <FOYContainer className="py-8">
        <FOYEmptyState
          icon={TrendingUp}
          title="No progress yet"
          description="Log workouts and sets with weight to see summary, PRs, and charts."
        >
          <FOYButtonLink href="/focusedonyou/workout" variant="primary" className="min-h-12 px-6">
            Go to Workouts
          </FOYButtonLink>
        </FOYEmptyState>
      </FOYContainer>
    );
  }

  return (
    <FOYContainer className="py-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Progress</h2>

      <section className="mb-8">
        <ProgressSummaryCards data={summary ?? { workoutCount: 0, setCount: 0, volume: 0 }} />
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-sm font-medium text-[var(--textMuted)]">Top 5 PRs</h3>
        <ProgressPRs prs={prs} />
      </section>

      {days.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--textMuted)]">Last 14 days</h3>
            <button
              type="button"
              onClick={() =>
                setChartMetric((m) => (m === "workoutCount" ? "volume" : "workoutCount"))
              }
              className="text-xs text-[var(--ice)] hover:underline"
            >
              {chartMetric === "workoutCount" ? "Show volume" : "Show workouts"}
            </button>
          </div>
          <ProgressChart days={days} metric={chartMetric} />
        </section>
      )}
    </FOYContainer>
  );
}

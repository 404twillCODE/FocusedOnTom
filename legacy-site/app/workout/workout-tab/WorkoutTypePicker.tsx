"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import { getUserTemplates, type WorkoutTemplate } from "@/lib/supabase/workout";
import { Button } from "@/components/ui/button";

const TRAINING_CHOICES = [
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Full Body",
  "Custom",
] as const;

export function WorkoutTypePicker({
  userId,
  onSelect,
  onBack,
  onError,
  isCreating = false,
}: {
  userId: string;
  onSelect: (dayLabel: string, templateId: string | null) => void;
  onBack: () => void;
  onError: (msg: string) => void;
  isCreating?: boolean;
}) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUserTemplates(userId)
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch((e) => {
        if (!cancelled) onError(e instanceof Error ? e.message : "Failed to load templates");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, onError]);

  function handlePick(choice: string) {
    const template = templates.find((t) => t.name === choice);
    onError("");
    onSelect(choice, template?.id ?? null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-[var(--textMuted)] hover:text-[var(--text)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <h2 className="text-xl font-semibold text-[var(--text)]">What are you training?</h2>
        <p className="mt-1 text-sm text-[var(--textMuted)]">
          Choose a focus. We’ll create a session and preload exercises if you have a template.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {TRAINING_CHOICES.map((choice) => (
            <Button
              key={choice}
              variant="outline"
              className="min-w-[7rem] border-[var(--border)] bg-[var(--bg2)]/80 text-[var(--text)] hover:bg-[var(--iceSoft)]/30 hover:border-[var(--ice)]/50"
              onClick={() => handlePick(choice)}
              disabled={isCreating}
            >
              {choice}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

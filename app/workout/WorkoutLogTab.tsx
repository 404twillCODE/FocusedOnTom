"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  getMyLogs,
  insertLog,
  updateLog,
  deleteLog,
} from "@/lib/supabase/workout";
import type { WorkoutLog } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const WORKOUT_TYPES = ["push", "pull", "legs", "cardio", "other"] as const;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function WorkoutLogTab({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [formType, setFormType] = useState<string>("push");
  const [formDuration, setFormDuration] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadLogs() {
    setLoading(true);
    getMyLogs(userId)
      .then(setLogs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadLogs();
  }, [userId]);

  function openNew() {
    setEditingId(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormType("push");
    setFormDuration("");
    setFormNotes("");
    setError("");
    setShowForm(true);
  }

  function openEdit(log: WorkoutLog) {
    setEditingId(log.id);
    setFormDate(log.date);
    setFormType(log.workout_type);
    setFormDuration(String(log.duration_min || ""));
    setFormNotes(log.notes || "");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) {
        await updateLog(editingId, userId, {
          date: formDate,
          workout_type: formType,
          duration_min: parseInt(formDuration, 10) || 0,
          notes: formNotes.trim(),
        });
      } else {
        await insertLog(userId, {
          date: formDate,
          workout_type: formType,
          duration_min: parseInt(formDuration, 10) || 0,
          notes: formNotes.trim(),
        });
      }
      closeForm();
      loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(logId: string) {
    if (!confirm("Delete this workout?")) return;
    setSaving(true);
    try {
      await deleteLog(logId, userId);
      if (editingId === logId) closeForm();
      loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setSaving(false);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="pb-24">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text)]">My workouts</h2>
        <Button onClick={openNew} className="inline-flex items-center justify-center gap-2 px-5 py-2.5">
          <Plus className="h-4 w-4 shrink-0" />
          <span>Log</span>
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg2)] p-4"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--textMuted)]">
                  Date
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--textMuted)]">
                  Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--ice)]/50 focus:outline-none"
                >
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--textMuted)]">
                  Duration (min)
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--textMuted)]">
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional"
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--textMuted)] focus:border-[var(--ice)]/50 focus:outline-none"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--textMuted)] hover:border-[var(--ice)]/50 hover:text-[var(--text)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-[var(--textMuted)]">
          No workouts yet. Tap &quot;Log&quot; to add one.
        </p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <motion.li
              key={log.id}
              layout
              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 px-4 py-3"
            >
              <div>
                <p className="font-medium capitalize text-[var(--text)]">
                  {log.workout_type}
                </p>
                <p className="text-xs text-[var(--textMuted)]">
                  {formatDate(log.date)}
                  {log.duration_min > 0 && ` · ${log.duration_min} min`}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(log)}
                  className="rounded-lg p-2 text-[var(--textMuted)] hover:bg-white/10 hover:text-[var(--ice)]"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(log.id)}
                  className="rounded-lg p-2 text-[var(--textMuted)] hover:bg-red-500/20 hover:text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

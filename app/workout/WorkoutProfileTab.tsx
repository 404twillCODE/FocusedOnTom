"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getMyProfile, upsertProfile, resetWorkoutSetup } from "@/lib/supabase/workout";
import type { Profile } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export function WorkoutProfileTab({
  userId,
  onSignOut,
}: {
  userId: string;
  onSignOut: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyProfile(userId)
      .then((p) => {
        setProfile(p);
        if (p) {
          setUsername(p.username);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile."))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const u = username.trim().toLowerCase();
    if (!u) {
      setError("Username is required.");
      return;
    }
    if (u.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    if (!USERNAME_REGEX.test(u)) {
      setError("Username can only contain letters, numbers, underscore and hyphen.");
      return;
    }
    setSaving(true);
    try {
      // Use username as display name everywhere
      const updated = await upsertProfile(userId, {
        username: u,
        display_name: u,
      });
      setProfile(updated);
      setUsername(updated.username);
      setEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save.";
      if (String(msg).toLowerCase().includes("unique") || String(msg).toLowerCase().includes("duplicate")) {
        setError("That username is already taken.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" />
        <p className="text-sm text-[var(--textMuted)]">Loading profile…</p>
      </div>
    );
  }

  const needsProfile = !profile;
  const canEdit = needsProfile || (profile !== null && editing);

  return (
    <div className="pb-24">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-6">
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--iceSoft)] text-[var(--ice)]">
            <User className="h-8 w-8" />
          </span>
        </div>
        {error && (
          <p className="mt-3 text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {needsProfile && (
          <p className="mt-2 text-center text-sm text-[var(--textMuted)]">
            Set a username to use the app (it will be shown in the feed).
          </p>
        )}
        {canEdit ? (
          <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--textMuted)]">
                Username (unique)
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. tom_fit"
                className="w-full"
                disabled={saving}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
              {!needsProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setUsername(profile?.username ?? "");
                    setError("");
                  }}
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--textMuted)] hover:border-[var(--ice)]/50 hover:text-[var(--text)]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <>
            <h2 className="mt-4 text-center text-xl font-semibold text-[var(--text)]">
              {profile?.display_name ?? profile?.username ?? "—"}
            </h2>
            <p className="text-center text-sm text-[var(--textMuted)]">
              @{profile?.username ?? "—"}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setUsername(profile?.username ?? "");
                  setError("");
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg3)]/80 px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/50 hover:text-[var(--ice)]"
              >
                Edit profile
              </button>
            </div>
          </>
        )}
      </div>
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 p-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">Workout settings</h3>
          <p className="mt-1 text-xs text-[var(--textMuted)]">
            Control how the Log tab behaves.
          </p>
          <div className="mt-3 flex flex-col gap-2 text-xs">
            <button
              type="button"
              onClick={async () => {
                // Simplest path: mark setup as incomplete so the wizard runs again.
                try {
                  await resetWorkoutSetup(userId);
                } catch {
                  // ignore; wizard will still be available on next load
                }
                // Give a gentle hint; real edit happens when user returns to Log.
                alert("Next time you open the Log tab, the setup wizard will appear again.");
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg3)]/80 px-4 py-2.5 text-left text-xs font-medium text-[var(--text)] hover:border-[var(--ice)]/50 hover:text-[var(--ice)]"
            >
              Edit workout setup
            </button>
            <button
              type="button"
              onClick={async () => {
                if (
                  !window.confirm(
                    "Reset workout setup? Your past sessions stay, but you will re-run the wizard."
                  )
                ) {
                  return;
                }
                try {
                  await resetWorkoutSetup(userId);
                  alert("Workout setup reset. The wizard will appear next time in the Log tab.");
                } catch {
                  alert("Failed to reset workout setup. Please try again later.");
                }
              }}
              className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-left text-xs font-medium text-red-300 hover:border-red-400 hover:text-red-200"
            >
              Reset setup
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--textMuted)] hover:border-red-500/50 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

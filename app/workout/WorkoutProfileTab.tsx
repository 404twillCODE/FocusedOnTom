"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getMyProfile, upsertProfile } from "@/lib/supabase/workout";
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
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyProfile(userId)
      .then((p) => {
        setProfile(p);
        if (p) {
          setUsername(p.username);
          setDisplayName(p.display_name);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile."))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const u = username.trim().toLowerCase();
    const d = displayName.trim();
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
    if (!d) {
      setError("Display name is required.");
      return;
    }
    setSaving(true);
    try {
      const updated = await upsertProfile(userId, {
        username: u,
        display_name: d,
      });
      setProfile(updated);
      setUsername(updated.username);
      setDisplayName(updated.display_name);
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
  const canEdit = profile && (editing || needsProfile);

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
            Set a username and display name to use the app.
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
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--textMuted)]">
                Display name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Tom"
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
                    setDisplayName(profile?.display_name ?? "");
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
              {profile?.display_name ?? "—"}
            </h2>
            <p className="text-center text-sm text-[var(--textMuted)]">
              @{profile?.username ?? "—"}
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setEditing(true)}>Edit profile</Button>
            </div>
          </>
        )}
      </div>
      <div className="mt-6 flex justify-center">
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
  );
}

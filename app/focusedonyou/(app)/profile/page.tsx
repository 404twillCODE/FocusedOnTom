"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Loader2, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { getFOYProfile, upsertFOYProfile } from "@/lib/supabase/foyDb";
import {
  FOYContainer,
  FOYCard,
  FOYInput,
  FOYButton,
  FOYEmptyState,
} from "@/app/focusedonyou/_components";

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getFOYSupabase();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      setUserId(user?.id ?? null);
      if (!user) {
        setLoading(false);
        return;
      }
      getFOYProfile(supabase, user.id)
        .then((profile) => {
          setDisplayName(profile?.display_name ?? "");
        })
        .catch(() => setError("Could not load profile."))
        .finally(() => setLoading(false));
    });
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError("");
    setSaving(true);
    const supabase = getFOYSupabase();
    try {
      await upsertFOYProfile(supabase, userId, {
        display_name: displayName.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = getFOYSupabase();
    await supabase.auth.signOut();
    router.replace("/focusedonyou/auth");
    router.refresh();
  }

  if (loading) {
    return (
      <FOYContainer className="py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ice)]" aria-hidden />
          <p className="text-sm text-[var(--textMuted)]">Loading profile…</p>
        </div>
      </FOYContainer>
    );
  }

  if (!userId) {
    return (
      <FOYContainer className="py-8">
        <FOYEmptyState
          icon={UserIcon}
          title="Not signed in"
          description="Sign in to view and edit your profile."
        >
          <FOYButton onClick={() => router.push("/focusedonyou/auth")}>
            Sign in
          </FOYButton>
        </FOYEmptyState>
      </FOYContainer>
    );
  }

  return (
    <FOYContainer className="py-8">
      <div className="space-y-6">
        <FOYCard>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
              <UserIcon className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold text-[var(--text)]">Profile</h2>
              <p className="text-sm text-[var(--textMuted)]">
                Your display name is shown in the app.
              </p>
            </div>
          </div>
          <form onSubmit={handleSaveName} className="mt-4 flex flex-col gap-3">
            <label htmlFor="display-name" className="text-sm font-medium text-[var(--text)]">
              Display name
            </label>
            <FOYInput
              id="display-name"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={saving}
            />
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <FOYButton type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </span>
              ) : (
                "Save"
              )}
            </FOYButton>
          </form>
        </FOYCard>

        <FOYCard>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg3)] text-[var(--textMuted)]">
                <LogOut className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium text-[var(--text)]">Sign out</p>
                <p className="text-sm text-[var(--textMuted)]">
                  Sign out of your account on this device.
                </p>
              </div>
            </div>
            <FOYButton variant="secondary" onClick={handleSignOut}>
              Sign out
            </FOYButton>
          </div>
        </FOYCard>
      </div>
    </FOYContainer>
  );
}

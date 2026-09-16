"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { ChatShell } from "./ChatShell";

export default function WorkoutChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen -mt-16 sm:-mt-20">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ice)]/30" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen -mt-16 sm:-mt-20">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
          <p className="text-sm text-[var(--textMuted)]">
            You need to be signed in to use chat.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen -mt-16 sm:-mt-20">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-8">
        <ChatShell userId={user.id} />
      </div>
    </main>
  );
}


"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getFOYSupabase } from "@/lib/supabase/foyClient";
import { getFOYUserSettings } from "@/lib/supabase/foyDb";
import { FOY_ONBOARDING_ENTRY_PATH } from "./FOYOnboardingConfig";

const ONBOARDING_PATH_PREFIX = "/focusedonyou/onboarding";

export function FOYOnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isOnboardingRoute = pathname.startsWith(ONBOARDING_PATH_PREFIX);

  useEffect(() => {
    if (isOnboardingRoute) {
      setReady(true);
      return;
    }

    const supabase = getFOYSupabase();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) {
        setReady(true);
        return;
      }
      getFOYUserSettings(supabase, user.id).then((settings) => {
        const completed = settings?.onboarding_completed ?? false;
        if (!completed) {
          router.replace(FOY_ONBOARDING_ENTRY_PATH);
          return;
        }
        setReady(true);
      }).catch(() => setReady(true));
    });
  }, [isOnboardingRoute, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ice)] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

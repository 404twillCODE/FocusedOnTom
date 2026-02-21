"use client";

import { usePathname } from "next/navigation";
import { FOYAppShell } from "./FOYAppShell";
import { FOYOnboardingGate } from "./FOYOnboardingGate";
import { FOYOnboardingLayout } from "./FOYOnboardingLayout";

const ONBOARDING_PREFIX = "/focusedonyou/onboarding";

export function FOYAppLayoutRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith(ONBOARDING_PREFIX);

  if (isOnboarding) {
    return <FOYOnboardingLayout>{children}</FOYOnboardingLayout>;
  }

  return (
    <FOYOnboardingGate>
      <FOYAppShell>{children}</FOYAppShell>
    </FOYOnboardingGate>
  );
}

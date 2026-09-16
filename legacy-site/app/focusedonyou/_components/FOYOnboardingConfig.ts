export const FOY_ONBOARDING_STEPS = [
  { path: "/focusedonyou/onboarding", step: 0 },
  { path: "/focusedonyou/onboarding/goal", step: 1 },
  { path: "/focusedonyou/onboarding/schedule", step: 2 },
  { path: "/focusedonyou/onboarding/equipment", step: 3 },
  { path: "/focusedonyou/onboarding/style", step: 4 },
  { path: "/focusedonyou/onboarding/done", step: 5 },
] as const;

export const FOY_ONBOARDING_STEP_COUNT = FOY_ONBOARDING_STEPS.length;

export function getOnboardingStepIndex(pathname: string): number {
  const found = FOY_ONBOARDING_STEPS.find((s) =>
    pathname === s.path || pathname.startsWith(s.path + "/")
  );
  return found?.step ?? 0;
}

export function getOnboardingProgress(pathname: string): number {
  const step = getOnboardingStepIndex(pathname);
  return (step + 1) / FOY_ONBOARDING_STEP_COUNT;
}

export const FOY_ONBOARDING_ENTRY_PATH = "/focusedonyou/onboarding";
export const FOY_ONBOARDING_DONE_PATH = "/focusedonyou/onboarding/done";

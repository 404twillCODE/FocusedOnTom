import type { LucideIcon } from "lucide-react";
import { Home, Dumbbell, ClipboardList, TrendingUp, User } from "lucide-react";

export const FOY_TABS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/focusedonyou", label: "Home", icon: Home },
  { path: "/focusedonyou/workout", label: "Workout", icon: Dumbbell },
  { path: "/focusedonyou/log", label: "Log", icon: ClipboardList },
  { path: "/focusedonyou/progress", label: "Progress", icon: TrendingUp },
  { path: "/focusedonyou/profile", label: "Profile", icon: User },
];

export const FOY_SETTINGS_PATH = "/focusedonyou/settings";

export function getFOYTitle(pathname: string): string {
  if (pathname === FOY_SETTINGS_PATH) return "Settings";
  const tab = FOY_TABS.find(
    (t) => t.path === pathname || (t.path !== "/focusedonyou" && pathname.startsWith(t.path + "/"))
  );
  return tab?.label ?? "Home";
}

export function isFOYTabActive(pathname: string, tabPath: string): boolean {
  if (tabPath === "/focusedonyou") return pathname === "/focusedonyou";
  return pathname.startsWith(tabPath);
}

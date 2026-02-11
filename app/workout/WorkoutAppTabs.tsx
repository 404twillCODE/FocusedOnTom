"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Plus, BarChart3, User } from "lucide-react";
import { WorkoutFeedTab } from "./WorkoutFeedTab";
import { WorkoutLogTab } from "./WorkoutLogTab";
import { WorkoutStatsTab } from "./WorkoutStatsTab";
import { WorkoutProfileTab } from "./WorkoutProfileTab";
import { WorkoutMemberProfile } from "./WorkoutMemberProfile";

const TABS = [
  { id: "feed", label: "Feed", icon: LayoutGrid },
  { id: "log", label: "Log", icon: Plus },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function WorkoutAppTabs({
  userId,
  onSignOut,
}: {
  userId: string;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<TabId>("feed");
  const [memberUsername, setMemberUsername] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-lg">
      <div className="border-b border-[var(--border)]">
        <nav className="flex gap-0" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`
                relative flex flex-1 flex-col items-center gap-1 px-2 py-3 text-sm
                transition-colors
                ${tab === id ? "text-[var(--ice)]" : "text-[var(--textMuted)] hover:text-[var(--text)]"}
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              {tab === id && (
                <motion.span
                  layoutId="workout-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ice)]"
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="min-h-[50vh] px-4 pt-5">
        {tab === "feed" && (
          <WorkoutFeedTab onSelectMember={(username) => setMemberUsername(username)} />
        )}
        {tab === "log" && <WorkoutLogTab userId={userId} />}
        {tab === "stats" && <WorkoutStatsTab userId={userId} />}
        {tab === "profile" && (
          <WorkoutProfileTab userId={userId} onSignOut={onSignOut} />
        )}
      </div>
      <WorkoutMemberProfile
        username={memberUsername}
        onClose={() => setMemberUsername(null)}
      />
    </div>
  );
}

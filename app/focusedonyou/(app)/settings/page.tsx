"use client";

import Link from "next/link";
import { Settings, FileSpreadsheet } from "lucide-react";
import { FOYContainer, FOYCard, FOYBackLink } from "@/app/focusedonyou/_components";

export default function SettingsPage() {
  return (
    <FOYContainer className="py-8">
      <div className="mb-6">
        <FOYBackLink href="/focusedonyou" ariaLabel="Back to FocusedOnYou home">
          Back
        </FOYBackLink>
      </div>
      <FOYCard className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
            <Settings className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-[var(--text)]">Settings</h2>
            <p className="text-sm text-[var(--textMuted)]">
              Preferences and account options.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
          <Link
            href="/focusedonyou/settings/import/apple-health"
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/30 px-4 py-3 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/40 hover:bg-[var(--iceSoft)]/20"
          >
            <FileSpreadsheet className="h-5 w-5 text-[var(--ice)]" aria-hidden />
            Import Apple Health (CSV)
          </Link>
        </div>
      </FOYCard>
    </FOYContainer>
  );
}

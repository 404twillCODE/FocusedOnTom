"use client";

import Link from "next/link";
import { FOYContainer, FOYButtonLink } from "@/app/focusedonyou/_components";

export default function GetStartedPage() {
  return (
    <FOYContainer className="py-16">
      <h1 className="text-2xl font-semibold text-[var(--text)]">
        Get Started
      </h1>
      <p className="mt-2 text-[var(--textMuted)]">
        Sign in or create an account to start logging workouts.
      </p>
      <div className="mt-6">
        <FOYButtonLink href="/focusedonyou" variant="secondary">
          Back to FocusedOnYou
        </FOYButtonLink>
      </div>
    </FOYContainer>
  );
}

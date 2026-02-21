"use client";

import Link from "next/link";
import { FOYContainer, FOYButtonLink } from "@/app/focusedonyou/_components";

export default function PreviewPage() {
  return (
    <FOYContainer className="py-16">
      <h1 className="text-2xl font-semibold text-[var(--text)]">
        Preview
      </h1>
      <p className="mt-2 text-[var(--textMuted)]">
        Take a quick look at how FocusedOnYou works before signing up.
      </p>
      <div className="mt-6">
        <FOYButtonLink href="/focusedonyou" variant="secondary">
          Back to FocusedOnYou
        </FOYButtonLink>
      </div>
    </FOYContainer>
  );
}

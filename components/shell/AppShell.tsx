"use client";

import { TopNav } from "./TopNav";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { TerminalLauncher } from "@/components/terminal/TerminalLauncher";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <TopNav />
      <main className="min-h-screen pt-20">{children}</main>
      <TerminalLauncher />
      <TerminalPanel />
    </>
  );
}

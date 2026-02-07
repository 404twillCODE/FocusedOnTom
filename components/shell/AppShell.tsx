"use client";

import { TopNav } from "./TopNav";
import { PreviewBanner, usePreviewBanner } from "./PreviewBanner";
import { DebugOverlay } from "./DebugOverlay";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { TerminalLauncher } from "@/components/terminal/TerminalLauncher";
import { GalaxyMiniMap } from "@/components/universe/GalaxyMiniMap";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { show: previewActive, bannerHeight } = usePreviewBanner();

  return (
    <>
      {previewActive && (
        <div aria-hidden style={{ height: bannerHeight }} />
      )}
      <PreviewBanner show={previewActive} />
      <TopNav />
      <main
        className="min-h-screen pt-20"
        style={
          previewActive
            ? { paddingTop: `calc(5rem + ${bannerHeight}px)` }
            : undefined
        }
      >
        {children}
      </main>
      <GalaxyMiniMap />
      <DebugOverlay />
      <TerminalLauncher />
      <TerminalPanel />
    </>
  );
}

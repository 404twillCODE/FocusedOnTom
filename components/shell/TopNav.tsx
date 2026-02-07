"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { GlassPanel } from "./GlassPanel";
import { SettingsPanel } from "./SettingsPanel";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.projects, label: "Projects" },
  { href: ROUTES.lab, label: "Lab" },
  { href: ROUTES.lifestyle, label: "Lifestyle" },
  { href: ROUTES.contact, label: "Contact" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <GlassPanel
        variant="panel"
        glow="none"
        className="mx-4 mt-4 border border-border/80 bg-panel/80 backdrop-blur-[var(--blur)]"
        style={{ WebkitBackdropFilter: "blur(var(--blur))" }}
      >
        <nav className="flex h-12 items-center justify-between px-4">
          <Link href={ROUTES.home} className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-panel-solid text-[10px] font-medium text-textMuted"
              aria-hidden
            >
              ◈
            </span>
            <span className="font-semibold tracking-tight text-text">FocusedOnTom</span>
          </Link>
          <div className="flex items-center gap-0.5">
            {navItems.map(({ href, label }) => (
              <Button
                key={href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "text-textMuted hover:bg-panel-solid hover:text-text",
                  pathname === href && "text-text"
                )}
              >
                <Link href={href}>{label}</Link>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="text-textMuted hover:bg-panel-solid hover:text-text"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </GlassPanel>
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}

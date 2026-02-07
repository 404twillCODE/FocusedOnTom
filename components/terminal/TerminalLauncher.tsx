"use client";

import { Terminal } from "lucide-react";
import { useAppStore, type AppState } from "@/store/appStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

export function TerminalLauncher() {
  const toggleTerminal = useAppStore((s: AppState) => s.toggleTerminal);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleTerminal}
            aria-label="Toggle terminal"
            className={cn(
              "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border",
              "bg-panel-solid text-text shadow-[var(--glowMint)] transition-[box-shadow,transform] duration-[var(--dur-med)] ease-[var(--ease)]",
              "hover:scale-105 hover:shadow-[0_0_30px_rgba(46,242,162,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            )}
            style={{ boxShadow: "var(--glowMint)" }}
          >
            <Terminal className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="border-border bg-panel-solid text-text">
          Toggle terminal
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

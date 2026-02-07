"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassPanel } from "./GlassPanel";
import { useAppStore, type AppState, type QualityMode } from "@/store/appStore";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

const QUALITY_OPTIONS: { value: QualityMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const qualityMode = useAppStore((s: AppState) => s.qualityMode);
  const setQualityMode = useAppStore((s: AppState) => s.setQualityMode);
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);
  const setReducedMotion = useAppStore((s: AppState) => s.setReducedMotion);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-border bg-panel-solid text-text"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-text">Settings</DialogTitle>
          <DialogDescription className="text-textMuted">
            Visuals adapt for performance. Quality and motion can be changed here; terminal
            commands will be available later.
          </DialogDescription>
        </DialogHeader>
        <GlassPanel variant="solid" glow="none" className="mt-4 space-y-4 rounded-lg border border-border p-4">
          <div>
            <p className="mb-2 text-sm font-medium text-text">Quality</p>
            <div className="flex flex-wrap gap-1.5">
              {QUALITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={qualityMode === opt.value ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    qualityMode === opt.value && "bg-mint text-bg hover:bg-mint/90"
                  )}
                  onClick={() => setQualityMode(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">Reduce motion</p>
              <p className="text-xs text-textMuted">Limits animations and smooth scroll</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reducedMotion}
              onClick={() => setReducedMotion(!reducedMotion)}
              className={cn(
                "relative h-6 w-10 shrink-0 rounded-full border border-border transition-colors",
                reducedMotion ? "bg-mint/30" : "bg-panel"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 block h-5 w-5 rounded-full border border-border bg-panel-solid transition-transform",
                  reducedMotion ? "left-4" : "left-0.5"
                )}
              />
            </button>
          </div>
        </GlassPanel>
      </DialogContent>
    </Dialog>
  );
}

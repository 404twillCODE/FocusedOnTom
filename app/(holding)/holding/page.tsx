import Link from "next/link";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { cn } from "@/lib/cn";

export const metadata = {
  title: "In Development — FocusedOnTom",
  description: "FocusedOnTom is currently in development. Check back soon.",
};

export default function HoldingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      {/* Lightweight constellation background */}
      <div className="holding-constellation" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <GlassPanel
          variant="panel"
          glow="none"
          className={cn(
            "w-full max-w-md rounded-2xl border border-border px-6 py-8 shadow-xl",
            "backdrop-blur-[var(--blur)]"
          )}
          style={{ background: "var(--panel)" }}
        >
          <div className="space-y-6 text-center">
            <h1 className="font-mono text-xl font-medium tracking-tight text-text sm:text-2xl">
              FocusedOnTom is in development
            </h1>
            <p className="text-sm text-textMuted sm:text-base">
              I&apos;m building a cinematic interactive portfolio. Check back soon.
            </p>
            <div className="flex justify-center">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mint",
                  "bg-mint/10"
                )}
              >
                BUILD: In Progress
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-textMuted">
              <span>Follow updates:</span>
              <span className="text-mint/80">GitHub</span>
              <span className="text-mint/80">Discord</span>
              <span className="text-textMuted/60">(placeholders)</span>
            </div>
            <div className="pt-4">
              <Link
                href="/?preview=1"
                className={cn(
                  "inline-flex items-center rounded-lg border border-border bg-panel-solid px-4 py-2 font-mono text-sm text-text",
                  "hover:border-mint/40 hover:bg-mint/10 hover:text-mint transition-colors"
                )}
              >
                Owner Preview
              </Link>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

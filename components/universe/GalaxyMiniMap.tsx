"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { GlassPanel } from "@/components/shell/GlassPanel";

const NODES = [
  { id: "core", label: "Tom Core", path: ROUTES.home },
  { id: "skills", label: "Skills", path: ROUTES.home },
  { id: "projects", label: "Projects", path: ROUTES.projects },
  { id: "lab", label: "Lab", path: ROUTES.lab },
  { id: "lifestyle", label: "Lifestyle", path: ROUTES.lifestyle },
  { id: "contact", label: "Contact", path: ROUTES.contact },
] as const;

function pathMatches(pathname: string, nodePath: string): boolean {
  if (nodePath === ROUTES.home) return pathname === "/" || pathname === "";
  return pathname === nodePath || pathname.startsWith(nodePath + "/");
}

export function GalaxyMiniMap() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <GlassPanel
      variant="panel"
      glow="none"
      className={cn(
        "fixed bottom-6 left-4 z-30 flex flex-col gap-1 rounded-lg border border-border/60 py-2 pl-2 pr-3",
        "bg-panel/75 backdrop-blur-[var(--blur)] transition-[transform,opacity] duration-300 ease-[var(--ease)]",
        "hover:scale-[1.02] hover:bg-panel/85",
        "md:bottom-8 md:left-6"
      )}
      style={{ WebkitBackdropFilter: "blur(var(--blur))" }}
      role="navigation"
      aria-label="Galaxy map"
    >
      <span className="mb-1 px-1.5 font-mono text-[10px] uppercase tracking-wider text-textMuted/80">
        Map
      </span>
      <nav className="flex flex-col gap-0.5">
        {NODES.map((node) => {
          const currentPath = pathname ?? "";
          const activeId = NODES.find((n) => pathMatches(currentPath, n.path))?.id;
          const isActive = activeId === node.id;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => router.push(node.path)}
              className={cn(
                "flex items-center gap-2 rounded-md px-1.5 py-1 text-left font-mono text-xs transition-colors",
                "hover:bg-panel-solid/80 hover:text-text",
                isActive ? "text-mint" : "text-textMuted"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                  isActive ? "bg-mint shadow-[0_0_6px_var(--mint)]" : "bg-textMuted/60"
                )}
              />
              <span className="truncate">{node.label}</span>
            </button>
          );
        })}
      </nav>
    </GlassPanel>
  );
}

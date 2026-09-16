"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Settings, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  FOY_TABS,
  FOY_SETTINGS_PATH,
  getFOYTitle,
  isFOYTabActive,
} from "./FOYNavConfig";
import { FOYActiveSessionRecovery } from "./FOYActiveSessionRecovery";

const HEADER_COLLAPSE_THRESHOLD = 48;

export function FOYAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const { scrollY } = useScroll({
    container: scrollRef,
  });

  useMotionValueEvent(scrollY, "change", (latest) => {
    setHeaderCollapsed(latest > HEADER_COLLAPSE_THRESHOLD);
  });

  const title = getFOYTitle(pathname);

  return (
    <div className="flex min-h-screen">
      <FOYActiveSessionRecovery />
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-52 flex-col border-r border-[var(--border)] bg-[var(--bg2)]/90 backdrop-blur-xl md:flex"
        aria-label="Main navigation"
      >
        <div className="flex flex-1 flex-col gap-1 p-3 pt-20">
          {FOY_TABS.map(({ path, label, icon: Icon }) => {
            const active = isFOYTabActive(pathname, path);
            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--ice)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg2)]",
                  active
                    ? "bg-[var(--iceSoft)] text-[var(--ice)]"
                    : "text-[var(--textMuted)] hover:bg-[var(--bg3)]/60 hover:text-[var(--text)]"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-[var(--border)] p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--textMuted)] transition-colors hover:text-[var(--text)]"
            aria-label="Back to Focused on Tom"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Focused on Tom
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col md:pl-52">
        {/* Top header — collapses on scroll (mobile) */}
        <motion.header
          className={cn(
            "fixed left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 backdrop-blur-xl md:left-52"
          )}
          initial={false}
          animate={{ y: headerCollapsed ? -56 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--text)]">
            {title}
          </h1>
          <Link
            href={FOY_SETTINGS_PATH}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--textMuted)] transition-colors duration-200 hover:bg-[var(--bg3)]/80 hover:text-[var(--text)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--ice)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" aria-hidden />
          </Link>
        </motion.header>

        {/* Scrollable content — tab transition */}
        <motion.div
          ref={scrollRef}
          className="flex-1 overflow-auto pt-14 pb-20 md:pb-0"
          initial={false}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </motion.div>

        {/* Bottom tab bar — mobile only */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--border)] bg-[var(--bg)]/95 py-2 backdrop-blur-xl md:hidden"
          aria-label="Tab navigation"
        >
          {FOY_TABS.map(({ path, label, icon: Icon }) => {
            const active = isFOYTabActive(pathname, path);
            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 transition-colors duration-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--ice)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                  active
                    ? "text-[var(--ice)]"
                    : "text-[var(--textMuted)] hover:text-[var(--text)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

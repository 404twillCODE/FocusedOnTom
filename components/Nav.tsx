"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const links = [
  { href: "/", label: "Home" },
  { href: "/dev", label: "Dev" },
  { href: "/skills", label: "Skills" },
  { href: "/photography", label: "Photography" },
  { href: "/contact", label: "Contact" },
];

function NavContent() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Hide nav on the workout app to keep it feeling like a standalone app.
  if (pathname.startsWith("/workout")) {
    return null;
  }

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 flex justify-center px-2 pt-2 sm:px-4 sm:pt-4"
      style={{ position: "fixed" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-11 min-w-0 max-w-4xl flex-1 items-center justify-between gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-xl sm:h-12 sm:gap-4 sm:px-6"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        <Link
          href="/"
          className="min-w-0 shrink text-xs font-semibold tracking-tight text-[var(--ice)] transition-colors hover:text-[var(--ice)]/90 sm:text-sm"
        >
          <span className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Focused on Tom logo"
              width={24}
              height={24}
              className="h-6 w-6 rounded-md object-cover"
              priority
            />
            <span className="truncate text-[11px] leading-none sm:text-sm">
              Focused on Tom
            </span>
          </span>
        </Link>
        <ul className="hidden min-w-0 flex-1 items-center justify-end gap-1 sm:flex">
          {links.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className="relative flex items-center px-2 py-1.5 text-[11px] text-[var(--textMuted)] transition-colors hover:text-[var(--text)] sm:px-4 sm:py-2.5 sm:text-sm"
                  style={{
                    textShadow: "0 0 20px rgba(255,255,255,0.06)",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.08]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text)] transition-colors hover:bg-white/10 sm:hidden"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <path d="M6 6 18 18M18 6 6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </motion.div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-2 right-2 top-[3.5rem] rounded-2xl border border-white/[0.1] bg-[rgba(10,18,30,0.96)] p-2 backdrop-blur-xl sm:hidden"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.04) inset, 0 16px 36px rgba(0,0,0,0.35)",
            }}
          >
            <ul className="flex flex-col gap-1">
              {links.map(({ href, label }) => {
                const isActive =
                  href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block rounded-xl px-3 py-2.5 text-sm text-[var(--textMuted)] transition-colors hover:bg-white/[0.07] hover:text-[var(--text)]"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className={isActive ? "text-[var(--text)]" : undefined}>
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export function Nav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return (
      <nav
        className="fixed left-0 right-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
        style={{ position: "fixed" }}
        aria-hidden
      >
        <div className="flex h-11 max-w-4xl flex-1 items-center rounded-full border border-white/[0.08] bg-white/[0.06] px-3 sm:h-12 sm:px-6" />
      </nav>
    );
  }

  return createPortal(<NavContent />, document.body);
}

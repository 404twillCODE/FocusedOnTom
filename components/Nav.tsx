"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/", label: "Home" },
  { href: "/dev", label: "Dev" },
  { href: "/skills", label: "Skills" },
  { href: "/photography", label: "Photography" },
  { href: "/contact", label: "Contact" },
];

function NavContent() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
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
          className="shrink-0 text-xs font-semibold tracking-tight text-[var(--ice)] transition-colors hover:text-[var(--ice)]/90 sm:text-sm"
        >
          Focused on Tom
        </Link>
        <ul className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto sm:gap-1 [&::-webkit-scrollbar]:hidden">
          {links.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className="relative flex items-center px-2 py-2 text-xs text-[var(--textMuted)] transition-colors hover:text-[var(--text)] sm:px-4 sm:py-2.5 sm:text-sm"
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
      </motion.div>
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

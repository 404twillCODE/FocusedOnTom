"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-lg text-center"
      >
        <p className="text-sm font-medium tracking-wide text-[var(--ice)]">
          Focused on Tom
        </p>
        <motion.p
          className="mt-4 font-semibold tabular-nums tracking-tight text-[var(--text)] sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          404
        </motion.p>
        <p className="mt-4 text-lg text-[var(--textMuted)]">
          Lost in the starfield. The page you’re looking for isn’t here.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--ice)]/50 bg-[var(--iceSoft)]/30 px-5 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:border-[var(--ice)]/70 hover:bg-[var(--iceSoft)]/50 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/dev"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 px-5 py-2.5 text-sm font-medium text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/30 hover:text-[var(--text)] sm:w-auto"
          >
            <Compass className="h-4 w-4" />
            Explore projects
          </Link>
        </div>
        <motion.div
          className="mt-16 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 text-left"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <p className="text-sm font-medium text-[var(--text)]">Quick links</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {[
              { href: "/", label: "Home" },
              { href: "/dev", label: "Dev" },
              { href: "/skills", label: "Skills" },
              { href: "/photography", label: "Photography" },
              { href: "/websites", label: "Websites" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg3)]/60 px-3 py-1.5 text-xs text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/30 hover:text-[var(--ice)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </main>
  );
}

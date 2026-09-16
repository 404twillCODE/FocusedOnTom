"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/data";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
    >
      <div
        className={`flex w-full max-w-[var(--container)] items-center justify-between gap-4 transition-all duration-500 ease-out ${
          scrolled
            ? "rounded-full border border-white/12 bg-[rgba(10,18,28,0.55)] px-4 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:px-6"
            : "border border-transparent bg-transparent px-2 py-2 sm:px-3"
        }`}
      >
        <Link
          href="/"
          className="relative flex shrink-0 items-center gap-2.5"
          aria-label="Focused on Tom home"
        >
          <Image
            src="/logo.png"
            alt="Focused on Tom logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            priority
          />
          <span
            className={`whitespace-nowrap text-sm font-semibold tracking-[0.04em] text-[var(--text)] sm:text-[15px] ${
              scrolled ? "hidden xl:inline" : ""
            }`}
          >
            Focused on Tom
          </span>
        </Link>

        <nav
          className="hidden items-center justify-end gap-6 md:flex lg:gap-8"
          aria-label="Primary"
        >
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative whitespace-nowrap pb-1.5 text-[11px] font-medium tracking-[0.18em] transition-colors lg:text-xs ${
                  active
                    ? "text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {link.label.toUpperCase()}
                <span
                  className={`absolute bottom-0 left-0 h-px bg-[var(--accent)] transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[var(--text)] md:hidden ${
            scrolled ? "border-white/15 bg-white/[0.05]" : "border-white/10"
          }`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="absolute left-3 right-3 top-[4.25rem] rounded-3xl border border-white/12 bg-[rgba(7,17,26,0.92)] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-2xl px-4 py-3 text-sm tracking-[0.16em] transition-colors ${
                      active
                        ? "bg-white/[0.06] text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text)]"
                    }`}
                  >
                    {link.label.toUpperCase()}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

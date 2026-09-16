"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EXPLORE_NAV } from "@/lib/explore/constants";

export function ExploreSubnav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-[4.35rem] z-40 border-b border-white/10 bg-[rgba(7,17,26,0.86)] backdrop-blur-xl sm:top-[4.75rem]">
      <nav
        className="container-page flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Explore New York"
      >
        {EXPLORE_NAV.map((item) => {
          const active =
            item.href === "/explore"
              ? pathname === "/explore"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] uppercase transition-colors ${
                active
                  ? "bg-white/[0.08] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {item.label}
              {active && (
                <span className="ml-2 inline-block h-1 w-1 rounded-full bg-[var(--accent)] align-middle" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

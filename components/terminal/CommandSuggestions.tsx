"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

const MAX_ITEMS = 8;
const DROPDOWN_DURATION = 0.15;
const DROPDOWN_EASING = [0.32, 0.72, 0, 1] as const;

interface CommandSuggestionsProps {
  /** Only render when all three are true (parent responsibility). */
  open: boolean;
  query: string;
  items: string[];
  selectedIndex: number;
  listId: string;
  getOptionId: (index: number) => string;
  onSelect: (suggestion: string) => void;
  className?: string;
}

/**
 * VS Code / Warp style: strict visibility (open + query + items), max 8 rows,
 * onMouseDown to avoid input blur, glass glow on active row.
 * Fade + slight vertical drift animation (150ms).
 */
export function CommandSuggestions({
  open,
  query,
  items,
  selectedIndex,
  listId,
  getOptionId,
  onSelect,
  className,
}: CommandSuggestionsProps) {
  const selectedRef = useRef<HTMLLIElement>(null);

  const visible = open && query.trim().length > 0 && items.length > 0;
  const displayItems = items.slice(0, MAX_ITEMS);
  const clampedIndex = Math.min(selectedIndex, displayItems.length - 1);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [clampedIndex]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.ul
          id={listId}
          role="listbox"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{
            duration: DROPDOWN_DURATION,
            ease: DROPDOWN_EASING,
          }}
          className={cn(
            "absolute bottom-full left-0 right-0 z-10 mb-1 max-h-52 overflow-auto rounded-lg border border-border bg-panel-solid/95 py-1 shadow-lg backdrop-blur-[var(--blur)]",
            className
          )}
        >
          {displayItems.map((s, i) => {
            const isActive = i === clampedIndex;
            return (
              <li
                key={`${s}-${i}`}
                ref={i === clampedIndex ? selectedRef : undefined}
                id={getOptionId(i)}
                role="option"
                aria-selected={isActive}
                className={cn(
                  "cursor-pointer px-3 py-1.5 font-mono text-sm transition-colors",
                  isActive
                    ? "bg-mint/15 text-mint"
                    : "text-text hover:bg-panel"
                )}
                style={
                  isActive
                    ? { boxShadow: "inset 0 0 0 1px rgba(46, 242, 162, 0.2), 0 0 12px rgba(46, 242, 162, 0.08)" }
                    : undefined
                }
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(s);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(s);
                  }
                }}
              >
                {s}
              </li>
            );
          })}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}

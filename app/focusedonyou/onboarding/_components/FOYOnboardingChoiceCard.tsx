"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { FOYCard } from "@/app/focusedonyou/_components/FOYCard";

type CardProps = {
  label: string;
  selected?: boolean;
  className?: string;
};

type LinkProps = CardProps & { href: string };
type ButtonProps = CardProps & { onSelect: () => void };

export function FOYOnboardingChoiceCard(
  props: LinkProps | ButtonProps
) {
  const { label, selected, className } = props;
  const content = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <FOYCard
        className={cn(
          "flex min-h-[52px] items-center justify-center py-5 text-center transition-colors",
          selected && "border-[var(--ice)]/50 bg-[var(--iceSoft)]/30"
        )}
      >
        <span
          className={cn(
            "text-lg font-medium",
            selected ? "text-[var(--ice)]" : "text-[var(--text)]"
          )}
        >
          {label}
        </span>
      </FOYCard>
    </motion.div>
  );

  if ("href" in props) {
    return <Link href={props.href} className={className}>{content}</Link>;
  }
  return (
    <button
      type="button"
      onClick={props.onSelect}
      className={cn("block w-full text-left", className)}
    >
      {content}
    </button>
  );
}

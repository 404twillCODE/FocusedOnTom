"use client";

import { motion } from "framer-motion";
import { Github, Instagram, Youtube } from "lucide-react";
import { socialLinks } from "@/lib/social";
import { springSnappy } from "@/lib/motion";

const icons = {
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
};

type SocialLinksProps = {
  orientation?: "vertical" | "horizontal";
  className?: string;
  showRail?: boolean;
};

export function SocialLinks({
  orientation = "vertical",
  className = "",
  showRail = true,
}: SocialLinksProps) {
  const vertical = orientation === "vertical";

  return (
    <div
      className={`flex items-center ${
        vertical ? "flex-col gap-4" : "flex-row gap-5"
      } ${className}`}
    >
      {socialLinks.map((link, i) => {
        const Icon = icons[link.key];
        return (
          <motion.a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            initial={{ opacity: 0, y: vertical ? 10 : 0, x: vertical ? 0 : 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.45 }}
            whileHover={{
              scale: 1.15,
              y: vertical ? -2 : 0,
              color: "rgb(154,140,255)",
              transition: springSnappy,
            }}
            className="text-[var(--text-muted)]"
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </motion.a>
        );
      })}
      {showRail && vertical && (
        <div className="mt-1 flex flex-col items-center gap-2" aria-hidden>
          <motion.span
            className="w-px origin-top bg-white/15"
            initial={{ height: 0 }}
            animate={{ height: 64 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9, ...springSnappy }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef } from "react";
import Image from "next/image";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { cn } from "@/lib/cn";
import type { ProjectGalleryItem as GalleryItem } from "@/lib/types/content";

const isPlaceholder = (src: string) =>
  src.includes("placeholder") || src === "/placeholder.jpg";

interface ProjectGalleryProps {
  items: GalleryItem[];
  className?: string;
}

/** Horizontal scrollable gallery. Images are lazy-loaded via next/image. */
export function ProjectGallery({ items, className }: ProjectGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80"
        style={{ scrollbarGutter: "stable" }}
      >
        {items.map((item, i) => {
          if (item.type !== "image") return null;
          const usePlaceholderBlock = isPlaceholder(item.src);
          return (
            <figure
              key={i}
              className="min-w-[280px] max-w-[320px] flex-shrink-0 overflow-hidden rounded-[var(--radius-panel)]"
            >
              <GlassPanel variant="panel" glow="none" className="overflow-hidden border border-border/60 p-0">
                <div className="relative aspect-video w-full bg-panel-solid">
                  {usePlaceholderBlock ? (
                    <div
                      className="flex aspect-video w-full items-center justify-center text-textMuted/50 text-sm"
                      aria-hidden
                    >
                      Image
                    </div>
                  ) : (
                    <Image
                      src={item.src}
                      alt={item.caption || ""}
                      fill
                      sizes="(max-width: 768px) 280px, 320px"
                      className="object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
              </GlassPanel>
              {item.caption && (
                <figcaption className="mt-2 text-xs text-textMuted">{item.caption}</figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}

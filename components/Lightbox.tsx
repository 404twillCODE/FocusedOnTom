"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/lib/photography";

type LightboxProps = {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
};

export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null;

  const goNext = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % photos.length);
  }, [index, photos.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, goNext, goPrev]);

  const current = index !== null ? photos[index] : null;

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Close lightbox"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white backdrop-blur transition-colors hover:bg-white/[0.12] sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white backdrop-blur transition-colors hover:bg-white/[0.12] sm:left-6 sm:h-12 sm:w-12"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white backdrop-blur transition-colors hover:bg-white/[0.12] sm:right-6 sm:h-12 sm:w-12"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={current.src}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-4 flex max-h-[88vh] max-w-[92vw] flex-col items-center gap-3 sm:gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center">
              <Image
                src={current.src}
                alt={current.alt}
                width={current.width}
                height={current.height}
                sizes="92vw"
                className="max-h-[82vh] w-auto rounded-lg object-contain"
                priority
              />
            </div>
            <LightboxMeta
              photo={current}
              index={index}
              total={photos.length}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LightboxMeta({
  photo,
  index,
  total,
}: {
  photo: Photo;
  index: number | null;
  total: number;
}) {
  const exif = photo.exif;
  const caption = photo.caption ?? photo.alt;

  const exifBits: string[] = [];
  if (exif?.camera) exifBits.push(exif.camera);
  if (exif?.lens) exifBits.push(exif.lens);
  const settings: string[] = [];
  if (exif?.shutter) settings.push(exif.shutter);
  if (exif?.aperture) settings.push(exif.aperture);
  if (exif?.iso) settings.push(exif.iso);
  if (exif?.focal) settings.push(exif.focal);
  if (settings.length > 0) exifBits.push(settings.join(" · "));

  const hasMeta = Boolean(caption) || exifBits.length > 0 || total > 1;
  if (!hasMeta) return null;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full items-center justify-between gap-4 text-xs text-white/80 sm:text-sm">
        <span className="truncate">{caption}</span>
        {total > 1 && index !== null && (
          <span className="font-mono text-white/50">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
        )}
      </div>
      {exifBits.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/55 sm:text-xs">
          {exifBits.map((bit, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden className="text-white/25">
                  ·
                </span>
              )}
              <span>{bit}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

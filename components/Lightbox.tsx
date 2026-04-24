"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import {
  LIGHTBOX_QUALITY_FULL,
  LIGHTBOX_QUALITY_LOW,
  LIGHTBOX_SIZES,
  prefetchLightboxNeighbors,
} from "@/lib/photography-lightbox-image";
import type { Photo } from "@/lib/photography";

type LightboxProps = {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
};

/** Minimum horizontal travel (px) to count as a swipe between photos. */
const SWIPE_MIN_DISTANCE = 56;

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return fine;
}

export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null;
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressBackdropCloseRef = useRef(false);

  const goNext = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % photos.length);
  }, [index, photos.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onIndexChange]);

  useEffect(() => {
    if (index === null) return;
    prefetchLightboxNeighbors(photos, index);
  }, [index, photos]);

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

  const onTouchStartSwipe = useCallback(
    (e: React.TouchEvent) => {
      if (photos.length <= 1) return;
      const t = e.touches[0];
      if (!t) return;
      swipeStartRef.current = { x: t.clientX, y: t.clientY };
    },
    [photos.length]
  );

  const onTouchEndSwipe = useCallback(
    (e: React.TouchEvent) => {
      if (photos.length <= 1) return;
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start) return;

      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < SWIPE_MIN_DISTANCE) return;
      if (absX < absY * 1.05) return;

      if (dx <= -SWIPE_MIN_DISTANCE) goNext();
      else if (dx >= SWIPE_MIN_DISTANCE) goPrev();
    },
    [photos.length, goNext, goPrev]
  );

  const onTouchCancelSwipe = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => {
            if (suppressBackdropCloseRef.current) {
              suppressBackdropCloseRef.current = false;
              return;
            }
            onClose();
          }}
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
            onTouchStart={onTouchStartSwipe}
            onTouchEnd={onTouchEndSwipe}
            onTouchCancel={onTouchCancelSwipe}
          >
            <LightboxPhoto
              photo={current}
              onDragGestureOutside={() => {
                suppressBackdropCloseRef.current = true;
              }}
            />
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

function LightboxPhoto({
  photo,
  onDragGestureOutside,
}: {
  photo: Photo;
  onDragGestureOutside: () => void;
}) {
  const finePointer = useFinePointer();
  const [fullReady, setFullReady] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(2.25);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const suppressClickRef = useRef(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const MIN_ZOOM = 1.2;
  const MAX_ZOOM = 4;

  const clampPan = useCallback(
    (x: number, y: number) => {
      const vw = viewportRef.current?.clientWidth ?? 0;
      const vh = viewportRef.current?.clientHeight ?? 0;
      const maxX = Math.max(0, (vw * (zoomScale - 1)) / 2);
      const maxY = Math.max(0, (vh * (zoomScale - 1)) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    [zoomScale]
  );

  useEffect(() => {
    setFullReady(false);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
    dragRef.current = null;
  }, [photo.src]);

  useEffect(() => {
    if (!zoomed) {
      setPan({ x: 0, y: 0 });
      dragRef.current = null;
    }
  }, [zoomed]);

  useEffect(() => {
    if (!zoomed) return;
    setPan((p) => clampPan(p.x, p.y));
  }, [zoomScale, zoomed, clampPan]);

  useEffect(() => {
    if (!finePointer) return;
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      e.preventDefault();
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setPan(clampPan(drag.baseX + dx, drag.baseY + dy));
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [finePointer, clampPan]);

  const onToggleZoom = (e?: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!finePointer) return;
    setZoomed((prev) => {
      const next = !prev;
      if (!next) {
        setPan({ x: 0, y: 0 });
        return next;
      }

      if (!e || !viewportRef.current) return next;
      const rect = viewportRef.current.getBoundingClientRect();
      const offsetX = e.clientX - (rect.left + rect.width / 2);
      const offsetY = e.clientY - (rect.top + rect.height / 2);
      const target = clampPan(
        -offsetX * (zoomScale - 1),
        -offsetY * (zoomScale - 1)
      );
      setPan(target);
      return next;
    });
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!finePointer || !zoomed) return;
    e.preventDefault();
    onDragGestureOutside();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: pan.x,
      baseY: pan.y,
    };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      suppressClickRef.current = true;
      onDragGestureOutside();
    }
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!finePointer) return;
    e.preventDefault();
    setZoomed(true);
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    setPan(clampPan(-offsetX * (zoomScale - 1), -offsetY * (zoomScale - 1)));
  };

  return (
    <div
      ref={viewportRef}
      className={`relative overflow-hidden rounded-lg ${
        finePointer
          ? zoomed
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-zoom-in"
          : ""
      }`}
      style={{ maxWidth: "92vw", maxHeight: "82vh" }}
      onClick={(e) => onToggleZoom(e)}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onKeyDown={(e) => {
        if (!finePointer) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleZoom();
        }
      }}
      role={finePointer ? "button" : "img"}
      tabIndex={finePointer ? 0 : undefined}
      aria-label={finePointer ? "Activate to zoom image" : photo.alt}
      aria-pressed={finePointer ? zoomed : undefined}
    >
      <motion.div
        className="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1"
        animate={{
          scale: zoomed ? zoomScale : 1,
          x: pan.x,
          y: pan.y,
        }}
        transition={{
          type: dragRef.current ? false : "spring",
          stiffness: 230,
          damping: 30,
        }}
        style={{ transformOrigin: "center center" }}
      >
        <Image
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          sizes={LIGHTBOX_SIZES}
          quality={LIGHTBOX_QUALITY_LOW}
          className="max-h-[82vh] w-auto rounded-lg object-contain"
          priority
        />
        <Image
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          sizes={LIGHTBOX_SIZES}
          quality={LIGHTBOX_QUALITY_FULL}
          className={`max-h-[82vh] w-auto rounded-lg object-contain transition-opacity duration-300 ease-out ${
            fullReady ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setFullReady(true)}
          priority
        />
      </motion.div>
      {finePointer && zoomed && (
        <div
          className="absolute bottom-3 left-1/2 z-20 w-[min(300px,70vw)] -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-2 backdrop-blur"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 text-white/85">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() =>
                setZoomScale((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))
              }
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/12"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={zoomScale}
              onChange={(e) => setZoomScale(Number(e.target.value))}
              className="w-full accent-[var(--ice)]"
              aria-label="Zoom level"
            />
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() =>
                setZoomScale((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))
              }
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/12"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
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

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { usePortfolio } from "./Portfolio";
import AlbumGrid from "./AlbumGrid";
import {
  groupAlbumPhotos,
  safeUrl,
  type Collection,
  type Photo,
} from "../lib/catalog";

const descriptions: Record<string, string> = {
  "Adam LZ World Tour":
    "A weekend of cars, tire smoke, and the details between runs.",
  "Buffalo Cars And Coffee":
    "Early starts, good conversations, and a few very good reasons to bring a camera.",
  Camping:
    "Getting a little farther from the screen. Looking a little closer at everything else.",
  "Chrysler 300":
    "Familiar lines, a different perspective. A closer look at a personal favorite.",
  "Gas Station Shoot":
    "A late-night stop. Quiet streets, clean lines, and a different kind of car shoot.",
  "Sylvan Beach":
    "A quieter pace by the water, with a camera along for the walk.",
};
const subscribe = (listener: () => void) => {
  addEventListener("hashchange", listener);
  return () => removeEventListener("hashchange", listener);
};
function replaceRoute(hash: string) {
  history.replaceState(null, "", "#" + hash);
  dispatchEvent(new HashChangeEvent("hashchange"));
}

export default function Gallery() {
  const { catalog } = usePortfolio();
  const hash = useSyncExternalStore(
    subscribe,
    () => location.hash,
    () => "",
  );
  const [kind, id, photoId] = hash.slice(1).split("/");
  const collection =
    kind === "gallery" || kind === "photo"
      ? catalog.find((collection) => collection.id === id)
      : undefined;
  const dialog = useRef<HTMLDialogElement>(null),
    navigation = useRef<HTMLDivElement>(null),
    lastTrigger = useRef<HTMLElement | null>(null),
    lastPhoto = useRef<HTMLElement | null>(null),
    previousId = useRef<string | undefined>(undefined);
  const [section, setSection] = useState(""),
    [compact, setCompact] = useState(false),
    [expanded, setExpanded] = useState(false);
  const groups = useMemo(
    () => groupAlbumPhotos(collection?.photos || []),
    [collection],
  );
  const visibleGroups = useMemo(
    () =>
      groups.filter(
        (group) => !section || (group.name || "__ungrouped") === section,
      ),
    [groups, section],
  );
  const visiblePhotos = useMemo(
    () => visibleGroups.flatMap((group) => group.photos),
    [visibleGroups],
  );
  const allPhotos = useMemo(
    () => groups.flatMap((group) => group.photos),
    [groups],
  );
  const photos =
    kind === "photo" && !visiblePhotos.some((photo) => photo.id === photoId)
      ? allPhotos
      : visiblePhotos;
  const index = photos.findIndex((photo) => photo.id === photoId);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (collection) {
      if (!element.open) {
        lastTrigger.current = document.activeElement as HTMLElement;
        element.showModal();
      }
      if (previousId.current !== collection.id) {
        element.scrollTop = 0;
        setSection("");
        setCompact(false);
        setExpanded(false);
        previousId.current = collection.id;
      }
    } else if (element.open) {
      element.close();
      previousId.current = undefined;
      lastTrigger.current?.focus({ preventScroll: true });
    }
  }, [collection?.id]);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !collection) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
      },
      { root: element, threshold: 0.02, rootMargin: "0px 0px 60px 0px" },
    );
    element
      .querySelectorAll(".album-photo")
      .forEach((photo) => observer.observe(photo));
    return () => observer.disconnect();
  }, [collection, section]);
  const openPhoto = useCallback(
    (photoId: string, trigger: HTMLButtonElement) => {
      lastPhoto.current = trigger;
      location.hash = `photo/${collection!.id}/${photoId}`;
    },
    [collection?.id],
  );
  function close() {
    replaceRoute("photography");
  }
  function closePhoto() {
    replaceRoute(`gallery/${collection!.id}`);
    requestAnimationFrame(() =>
      lastPhoto.current?.focus({ preventScroll: true }),
    );
  }
  return (
    <>
      <dialog
        ref={dialog}
        id="gallery-dialog"
        className="gallery-dialog"
        aria-labelledby="gallery-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onScroll={(event) => setCompact(event.currentTarget.scrollTop > 120)}
        onPointerDown={(event) => {
          if (!navigation.current?.contains(event.target as Node))
            setExpanded(false);
        }}
      >
        <div
          ref={navigation}
          className={
            "dialog-bar album-navigation" +
            (compact ? " nav-compact" : "") +
            (expanded ? " menu-open" : "")
          }
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setExpanded(false);
          }}
        >
          <button
            className="album-brand"
            type="button"
            aria-label="Show gallery controls"
            aria-controls="gallery-close-icon"
            aria-expanded={!compact || expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            <img
              src="/assets/brand/focused-on-tom.svg"
              alt=""
              width="30"
              height="30"
            />
            <span>focused on tom.</span>
          </button>
          <button
            className="icon-button"
            id="gallery-close-icon"
            aria-label="Close collection"
            onClick={close}
          >
            ×
          </button>
        </div>
        <div className="gallery-inner">
          <div className="album-heading">
            <div>
              <span id="gallery-category" className="eyebrow">
                {collection?.category.toUpperCase()} / TOM WILLIAMS
              </span>
              <h2 id="gallery-title">{collection?.name}</h2>
              <span id="album-photo-count" className="album-photo-count">
                {visiblePhotos.length} photograph
                {visiblePhotos.length === 1 ? "" : "s"}
                {visiblePhotos[0]?.date ? " / " + visiblePhotos[0].date : ""}
              </span>
            </div>
            <div className="album-info">
              <p id="gallery-description">
                {collection &&
                  (descriptions[collection.name] ||
                    "A collection of moments through my lens.")}
              </p>
              <a
                id="full-gallery-link"
                className="text-link"
                target="_blank"
                rel="noopener noreferrer"
                href={safeUrl(
                  collection?.sourceUrl ||
                    "https://www.tevisuals.com/photographer/tom",
                )}
              >
                View on TE Visuals <span>↗</span>
              </a>
            </div>
          </div>
          <div
            id="album-filters"
            className="album-filters"
            role="group"
            aria-label="Filter album sections"
            hidden={!groups.some((group) => group.name)}
          >
            {[
              {
                name: "",
                label: "All photos",
                count: collection?.photos.length || 0,
              },
              ...groups.map((group) => ({
                name: group.name || "__ungrouped",
                label: group.name || "More photographs",
                count: group.photos.length,
              })),
            ].map((option) => (
              <button
                key={option.name}
                className="album-filter"
                type="button"
                data-section={option.name}
                aria-pressed={section === option.name}
                onClick={() => setSection(option.name)}
              >
                {option.label}
                <span>{String(option.count).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          <AlbumGrid
            groups={visibleGroups}
            photos={visiblePhotos}
            showHeadings={groups.length > 1}
            name={collection?.name || ""}
            onOpen={openPhoto}
          />
          <p className="album-signoff">
            A few things worth a second look.{" "}
            <span>PHOTOGRAPHS BY TOM WILLIAMS</span>
          </p>
        </div>
      </dialog>
      <PhotoViewer
        collection={collection}
        photos={photos}
        index={index}
        onClose={closePhoto}
      />
    </>
  );
}

type ViewerProps = {
  collection?: Collection;
  photos: Photo[];
  index: number;
  onClose: () => void;
};
function PhotoViewer({ collection, photos, index, onClose }: ViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null),
    image = useRef<HTMLImageElement>(null),
    frame = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(true),
    [status, setStatus] = useState(""),
    [copied, setCopied] = useState(false),
    [zoomed, setZoomed] = useState(false),
    [dragging, setDragging] = useState(false);
  const pan = useRef({ x: 0, y: 0, limitX: 0, limitY: 0 }),
    drag = useRef<{
      id: number;
      x: number;
      y: number;
      panX: number;
      panY: number;
      moved: boolean;
    } | null>(null),
    suppressClick = useRef(false),
    touch = useRef<number | null>(null);
  const photo = photos[index],
    open = !!photo && !!collection;
  function resetZoom() {
    setZoomed(false);
    setDragging(false);
    drag.current = null;
    suppressClick.current = false;
    pan.current = { x: 0, y: 0, limitX: 0, limitY: 0 };
    frame.current?.style.removeProperty("--zoom-width");
    frame.current?.style.removeProperty("--zoom-height");
    frame.current?.style.setProperty("--pan-x", "0px");
    frame.current?.style.setProperty("--pan-y", "0px");
  }
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);
  useLayoutEffect(() => {
    resetZoom();
    setCopied(false);
    setStatus("");
    setLoading(!(image.current?.complete && image.current?.naturalWidth));
  }, [photo?.id]);
  useEffect(() => {
    addEventListener("resize", resetZoom);
    return () => removeEventListener("resize", resetZoom);
  }, []);
  function move(delta: number) {
    if (!collection || !photos.length) return;
    replaceRoute(
      `photo/${collection.id}/${photos[(index + delta + photos.length) % photos.length].id}`,
    );
  }
  function updatePan(x: number, y: number) {
    const value = pan.current;
    value.x = Math.max(-value.limitX, Math.min(value.limitX, x));
    value.y = Math.max(-value.limitY, Math.min(value.limitY, y));
    frame.current?.style.setProperty("--pan-x", `${value.x}px`);
    frame.current?.style.setProperty("--pan-y", `${value.y}px`);
  }
  function zoom(event: MouseEvent<HTMLButtonElement>) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const img = image.current,
      element = frame.current;
    if (!img || !element) return;
    const photo = img.getBoundingClientRect(),
      box = element.getBoundingClientRect(),
      keyboard = event.detail === 0;
    if (
      !keyboard &&
      (event.clientX < photo.left ||
        event.clientX > photo.right ||
        event.clientY < photo.top ||
        event.clientY > photo.bottom)
    ) {
      onClose();
      return;
    }
    if (zoomed) {
      resetZoom();
      return;
    }
    if (!img.complete || !img.naturalWidth) return;
    const scale = Math.min(
      4,
      Math.max(
        2.25,
        (box.width / photo.width) * 1.2,
        (box.height / photo.height) * 1.2,
      ),
    );
    const width = photo.width * scale,
      height = photo.height * scale;
    pan.current.limitX = Math.max(0, (width - box.width) / 2);
    pan.current.limitY = Math.max(0, (height - box.height) / 2);
    element.style.setProperty("--zoom-width", `${width}px`);
    element.style.setProperty("--zoom-height", `${height}px`);
    setZoomed(true);
    updatePan(
      keyboard
        ? 0
        : -(event.clientX - photo.left - photo.width / 2) * (scale - 1),
      keyboard
        ? 0
        : -(event.clientY - photo.top - photo.height / 2) * (scale - 1),
    );
  }
  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!zoomed || !event.isPrimary || event.button !== 0) return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.current.x,
      panY: pan.current.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.id) return;
    const dx = event.clientX - current.x,
      dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < 5) return;
    current.moved = true;
    setDragging(true);
    updatePan(current.panX + dx, current.panY + dy);
  }
  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id !== event.pointerId) return;
    suppressClick.current = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const start = Math.max(0, Math.min(index - 3, photos.length - 7));
  return (
    <dialog
      ref={dialog}
      id="viewer"
      className="viewer"
      aria-label="Photograph viewer"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
      }}
    >
      <div className="viewer-top">
        <div className="viewer-collection">
          <span id="viewer-title">{collection?.name}</span>
          <span id="viewer-section">
            {photo?.section || collection?.category}
          </span>
        </div>
        <div className="album-brand" aria-hidden="true">
          <img
            src="/assets/brand/focused-on-tom.svg"
            alt=""
            width="30"
            height="30"
          />
          <span>focused on tom.</span>
        </div>
        <div className="viewer-top-actions">
          <span id="viewer-count" aria-live="polite">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(photos.length).padStart(2, "0")}
          </span>
          <button
            id="close-viewer"
            className="icon-button"
            aria-label="Close photograph"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>
      <div
        className="viewer-stage"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <button
          id="prev-photo"
          className="viewer-arrow"
          aria-label="Previous photograph"
          disabled={photos.length < 2}
          onClick={() => move(-1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          ref={frame}
          id="zoom-photo"
          className={
            "viewer-photo" +
            (loading ? " is-loading" : "") +
            (zoomed ? " zoomed" : "") +
            (dragging ? " is-dragging" : "")
          }
          aria-label={
            zoomed
              ? "Zoomed photograph. Drag to move, click to zoom out"
              : "Zoom photograph"
          }
          aria-pressed={zoomed}
          onClick={zoom}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={() => {
            drag.current = null;
            suppressClick.current = false;
            setDragging(false);
          }}
          onLostPointerCapture={() => {
            drag.current = null;
            setDragging(false);
          }}
          onTouchStart={(event) => {
            touch.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            if (touch.current !== null && !zoomed) {
              const delta = event.changedTouches[0].clientX - touch.current;
              if (Math.abs(delta) > 70) {
                suppressClick.current = true;
                move(delta > 0 ? -1 : 1);
              }
            }
            touch.current = null;
          }}
        >
          <img
            ref={image}
            id="viewer-image"
            src={photo ? safeUrl(photo.url) : undefined}
            alt={
              photo
                ? `${collection?.name} — ${photo.name || "Photograph " + (index + 1)} by Tom Williams`
                : ""
            }
            draggable={false}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setStatus(
                "This photograph could not be loaded. Try the next photograph or open the full collection.",
              );
            }}
          />
          <span className="viewer-zoom-hint" aria-hidden="true">
            Click to zoom <span>＋</span>
          </span>
        </button>
        <button
          id="next-photo"
          className="viewer-arrow"
          aria-label="Next photograph"
          disabled={photos.length < 2}
          onClick={() => move(1)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className="viewer-filmstrip">
        <div
          id="viewer-thumbnails"
          className="viewer-thumbnails"
          role="group"
          aria-label="Browse photographs"
        >
          {photos.slice(start, start + 7).map((item, offset) => (
            <button
              key={item.id}
              className="viewer-thumbnail"
              type="button"
              aria-label={`Show photograph ${start + offset + 1}`}
              aria-current={item.id === photo?.id}
              onClick={() => replaceRoute(`photo/${collection!.id}/${item.id}`)}
            >
              <img
                src={safeUrl(item.thumbnailUrl || item.url)}
                alt=""
                loading="eager"
                decoding="async"
              />
              <span className="viewer-thumbnail-preview" aria-hidden="true">
                <img
                  src={safeUrl(item.thumbnailUrl || item.url)}
                  alt=""
                  loading="eager"
                  decoding="async"
                />
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="viewer-bottom">
        <p id="viewer-camera">
          {photo &&
            (photo.techCaption ||
              [photo.camera, photo.lens, photo.settings]
                .filter(Boolean)
                .join(" · "))}
        </p>
        <div>
          <button
            id="copy-photo"
            className="text-link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                setCopied(true);
              } catch {
                setStatus(
                  "Copy the address from your browser to share this photograph.",
                );
              }
            }}
          >
            {copied ? "Link copied ✓" : "Copy photo link"}
          </button>
          <a
            id="buy-photo"
            className="pill"
            target="_blank"
            rel="noopener noreferrer"
            href={safeUrl(
              photo?.buyUrl ||
                photo?.sourceUrl ||
                collection?.sourceUrl ||
                "https://www.tevisuals.com/photographer/tom",
            )}
          >
            Prints & licensing ↗
          </a>
        </div>
      </div>
      <p className="viewer-status" id="viewer-status" role="status">
        {status}
      </p>
    </dialog>
  );
}

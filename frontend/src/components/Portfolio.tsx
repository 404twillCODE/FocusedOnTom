import { animate } from "motion/mini";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
  type RefObject,
} from "react";
import { normalizeCatalog, safeUrl, type Collection } from "../lib/catalog";
import { useMotion } from "../motion/MotionProvider";

const PortfolioContext = createContext<{
  catalog: Collection[];
  filter: string;
  setFilter: (value: string) => void;
  status: string;
}>({ catalog: [], filter: "all", setFilter: () => {}, status: "" });
export const usePortfolio = () => useContext(PortfolioContext);
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Collection[]>([]),
    [filter, setFilter] = useState("all"),
    [status, setStatus] = useState("");
  const pending = useRef<Collection[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let refreshing = false;
    function apply(data: Collection[]) {
      if (
        document.querySelector("#gallery-dialog[open]") ||
        document
          .querySelector("#collection-grid")
          ?.contains(document.activeElement)
      ) {
        pending.current = data;
        return;
      }
      setCatalog((current) =>
        JSON.stringify(current) === JSON.stringify(data) ? current : data,
      );
      pending.current = null;
    }
    async function refresh() {
      if (refreshing || document.hidden) return;
      refreshing = true;
      try {
        const response = await fetch("/api/portfolio-photos", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(45000),
          ]),
        });
        if (response.ok) {
          const data = normalizeCatalog(await response.json());
          apply(data);
          setStatus("");
        }
      } catch {
      } finally {
        refreshing = false;
      }
    }
    async function start() {
      try {
        const response = await fetch("/catalog.json", {
          signal: controller.signal,
        });
        if (!response.ok) throw Error();
        setCatalog(normalizeCatalog(await response.json()));
      } catch {
        if (!controller.signal.aborted)
          setStatus(
            "The photo library is taking a moment. You can still explore the full collection on TEVisuals.",
          );
      }
      if (!controller.signal.aborted) void refresh();
    }
    void start();
    const interval = setInterval(refresh, 15000);
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    const route = () => {
      if (
        !location.hash.startsWith("#photo/") &&
        !location.hash.startsWith("#gallery/") &&
        pending.current
      )
        apply(pending.current);
    };
    const focus = () => {
      if (pending.current) apply(pending.current);
    };
    document.addEventListener("visibilitychange", visible);
    document.addEventListener("focusin", focus);
    addEventListener("focus", visible);
    addEventListener("hashchange", route);
    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
      document.removeEventListener("focusin", focus);
      removeEventListener("focus", visible);
      removeEventListener("hashchange", route);
    };
  }, []);
  return (
    <PortfolioContext value={{ catalog, filter, setFilter, status }}>
      {children}
    </PortfolioContext>
  );
}
export function CollectionToolbar() {
  const { catalog, filter, setFilter } = usePortfolio();
  return (
    <div className="gallery-toolbar reveal">
      <div
        className="filter-tabs"
        role="group"
        aria-label="Filter photo collections"
      >
        {[
          ["all", "All work"],
          ["Automotive", "Automotive"],
          ["Nature", "Out in the world"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            data-filter={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
            {value === "all" && (
              <>
                {" "}
                <span id="collection-count">
                  {String(catalog.length).padStart(2, "0")}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
      <span className="gallery-hint">ALL ALBUMS. YOUR OWN PACE.</span>
    </div>
  );
}
export function CollectionGrid() {
  const { catalog, filter } = usePortfolio(),
    list = catalog.filter(
      (collection) => filter === "all" || collection.category === filter,
    );
  const { disabled } = useMotion();
  const previousFilter = useRef(filter);
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const changed = previousFilter.current !== filter;
    previousFilter.current = filter;
    if (
      !changed ||
      disabled ||
      typeof window.Animation !== "function" ||
      !grid.current
    )
      return;

    const transition = animate(
      grid.current,
      { opacity: [0.65, 1], transform: ["translateY(6px)", "none"] },
      { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    );
    return () => transition.cancel();
  }, [filter, disabled]);

  return <CollectionList key={filter} collections={list} gridRef={grid} />;
}
function CollectionList({
  collections,
  gridRef,
}: {
  collections: Collection[];
  gridRef: RefObject<HTMLDivElement | null>;
}) {
  const [limit, setLimit] = useState(6);
  const visible = collections.slice(0, limit);
  const remaining = Math.max(0, collections.length - limit);
  const { disabled } = useMotion();
  const moreButton = useRef<HTMLButtonElement>(null);
  const press = useRef<ReturnType<typeof animate> | null>(null);
  const nextFocus = useRef<number | "button" | null>(null);

  function changeLimit(event: MouseEvent<HTMLButtonElement>) {
    if (press.current) return;
    const update = () => {
      nextFocus.current = remaining ? visible.length : "button";
      setLimit(remaining ? Math.min(limit + 6, collections.length) : 6);
    };
    if (disabled || typeof window.Animation !== "function") {
      update();
      return;
    }
    const feedback = animate(
      event.currentTarget,
      { transform: ["none", "scale(0.93)", "none"] },
      { duration: 0.19, ease: "easeInOut" },
    );
    press.current = feedback;
    void feedback.then(() => {
      if (press.current !== feedback) return;
      press.current = null;
      update();
    });
  }

  useEffect(
    () => () => {
      press.current?.cancel();
      press.current = null;
    },
    [],
  );

  useEffect(() => {
    const target = nextFocus.current;
    if (target === null) return;
    nextFocus.current = null;
    const element =
      target === "button"
        ? moreButton.current
        : gridRef.current?.children[target];
    if (!(element instanceof HTMLElement)) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      block: "nearest",
      behavior: disabled || target === "button" ? "instant" : "smooth",
    });
  }, [limit, disabled, gridRef]);
  useEffect(() => {
    dispatchEvent(new Event("portfolio:collections"));
  }, [collections, limit]);
  return (
    <>
      <div
        ref={gridRef}
        id="collection-grid"
        className="collection-grid"
        aria-live="polite"
      >
        {visible.map((collection, index) => (
          <button
            key={collection.id}
            type="button"
            className="collection-card scroll-album reveal"
            aria-label={`Explore ${collection.name} collection`}
            onClick={() => {
              location.hash = `gallery/${collection.id}`;
            }}
          >
            <div className="collection-image">
              <img
                src={safeUrl(collection.coverUrl || collection.photos[0]?.url)}
                alt={`${collection.name} — photograph by Tom Williams`}
                loading="lazy"
                decoding="async"
              />
              <span className="collection-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="collection-open">↗</span>
            </div>
            <div className="collection-meta">
              <h3>{collection.name}</h3>
              <span>{collection.category.toUpperCase()}</span>
            </div>
            <p className="collection-caption">
              {collection.totalPhotos} photographs ·{" "}
              {collection.photos[0]?.date || "Through my lens"}
            </p>
          </button>
        ))}
        {!collections.length && (
          <p className="catalog-status" data-reveal>
            No collections in this category yet.
          </p>
        )}
      </div>
      {collections.length > 6 && (
        <div className="collection-pagination">
          <span className="collection-page-count" role="status">
            <span key={visible.length}>
              {visible.length} of {collections.length} collections
            </span>
          </span>
          <button
            ref={moreButton}
            type="button"
            className="collection-more"
            aria-controls="collection-grid"
            aria-expanded={limit > 6}
            data-collapse={!remaining || undefined}
            onClick={changeLimit}
          >
            {remaining ? "Show more collections" : "Show fewer collections"}
            <span className="collection-more-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="m4 6 4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      )}
    </>
  );
}
export function CatalogStatus() {
  const { status } = usePortfolio();
  return (
    <p id="catalog-status" className="catalog-status" role="status" data-reveal>
      {status}
    </p>
  );
}

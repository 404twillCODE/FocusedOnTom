import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { normalizeCatalog, safeUrl, type Collection } from "../lib/catalog";

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
  useEffect(() => {
    dispatchEvent(new Event("portfolio:collections"));
  }, [catalog, filter]);
  return (
    <div id="collection-grid" className="collection-grid" aria-live="polite">
      {list.map((collection, index) => (
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
      {catalog.length > 0 && !list.length && (
        <p className="catalog-status">No collections in this category yet.</p>
      )}
    </div>
  );
}
export function CatalogStatus() {
  const { status } = usePortfolio();
  return (
    <p id="catalog-status" className="catalog-status" role="status">
      {status}
    </p>
  );
}

import { memo, useMemo, type CSSProperties } from "react";
import { safeUrl, type Photo } from "../lib/catalog";
type Props = {
  groups: { name: string; photos: Photo[] }[];
  photos: Photo[];
  showHeadings: boolean;
  name: string;
  onOpen: (id: string, trigger: HTMLButtonElement) => void;
};
/** Photo navigation and navbar changes should not reconcile hundreds of album tiles. */
export default memo(function AlbumGrid({
  groups,
  photos,
  showHeadings,
  name,
  onOpen,
}: Props) {
  const positions = useMemo(
    () => new Map(photos.map((photo, index) => [photo.id, index])),
    [photos],
  );
  return (
    <div id="album-grid" className="album-grid">
      {groups.map((group, groupIndex) => (
        <section key={group.name} className="album-section">
          {(group.name || showHeadings) && (
            <div className="album-section-heading">
              <span className="album-section-index">
                {String(groupIndex + 1).padStart(2, "0")} /
              </span>
              <h3>{group.name || "More photographs"}</h3>
              <span className="album-section-count">
                {group.photos.length} photograph
                {group.photos.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
          <div className="album-section-grid">
            {group.photos.map((photo) => {
              const position = positions.get(photo.id)!;
              return (
                <button
                  key={photo.id}
                  className="album-photo"
                  type="button"
                  aria-label={`View photograph ${position + 1}: ${name}`}
                  style={
                    {
                      "--photo-delay": `${(position % 4) * 65}ms`,
                    } as CSSProperties
                  }
                  onClick={(event) => onOpen(photo.id, event.currentTarget)}
                >
                  <img
                    src={safeUrl(photo.thumbnailUrl || photo.url)}
                    alt={`${name} — ${photo.name || "Photograph " + (position + 1)}`}
                    loading="lazy"
                    decoding="async"
                    width={photo.width}
                    height={photo.height}
                    style={
                      photo.width && photo.height
                        ? { aspectRatio: `${photo.width} / ${photo.height}` }
                        : undefined
                    }
                  />
                  <span>View photograph ↗</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
});

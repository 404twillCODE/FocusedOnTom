// ---------------------------------------------------------------------------
// Maps TE Visuals categories / gallery slugs onto FocusedOnTom display
// categories (`cars`, `landscape`, `street`, …).
//
// Per the migration plan: TE Visuals owns the actual taxonomy
// (automotive / portraits / weddings / sports). FocusedOnTom decides how
// they appear in its UI. Add overrides here when you want a specific gallery
// to show under a different bucket than its TE Visuals category implies.
// ---------------------------------------------------------------------------

import type { TeVisualsCatalogGallery } from "./types";

/** TE Visuals category → FocusedOnTom display category. */
export const TEVISUALS_CATEGORY_MAP: Record<string, string> = {
  automotive: "cars",
  cars: "cars",
  landscape: "landscape",
  landscapes: "landscape",
  street: "street",
  portraits: "street",
  sports: "cars",
  weddings: "street",
};

/**
 * Per-gallery overrides keyed by TE Visuals gallery slug. Use this when a
 * single gallery belongs in a different FOT bucket than its category implies
 * (e.g. an automotive shoot you want under `street`).
 */
export const TEVISUALS_GALLERY_OVERRIDES: Record<string, string> = {
  // "adam-lz-worldtour-englishtown-nj": "cars",
};

/** Default bucket for galleries we can't map. */
export const TEVISUALS_DEFAULT_CATEGORY = "cars";

export function focusedontomCategoryForGallery(
  gallery: Pick<TeVisualsCatalogGallery, "category" | "slug">
): string {
  const slugKey = gallery.slug.trim().toLowerCase();
  if (TEVISUALS_GALLERY_OVERRIDES[slugKey]) {
    return TEVISUALS_GALLERY_OVERRIDES[slugKey];
  }
  const catKey = gallery.category.trim().toLowerCase();
  return TEVISUALS_CATEGORY_MAP[catKey] ?? TEVISUALS_DEFAULT_CATEGORY;
}

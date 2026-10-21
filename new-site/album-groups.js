// Keep TE Visuals' section labels and photo order, including newly added sections.
export function groupAlbumPhotos(photos) {
  const ordered = [...photos].sort((a,b) =>
    (Number.isFinite(a.displayOrder) ? a.displayOrder : Infinity) -
    (Number.isFinite(b.displayOrder) ? b.displayOrder : Infinity));
  const groups = new Map();
  for (const photo of ordered) {
    const name = typeof photo.section === 'string' ? photo.section.trim() : '';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(photo);
  }
  return [...groups].map(([name,photos]) => ({name,photos}));
}

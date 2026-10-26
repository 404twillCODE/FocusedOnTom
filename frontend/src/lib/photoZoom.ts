export function clampPhotoScale(scale: number) {
  return Math.max(1, Math.min(4, scale));
}

export function wheelPhotoScale(scale: number, delta: number, mode: number, pageHeight: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? pageHeight : 1);
  return clampPhotoScale(scale * Math.exp(-Math.max(-160, Math.min(160, pixels)) * 0.0015));
}

export function photoZoomPosition(previousScale: number, scale: number, x: number, y: number, anchorX: number, anchorY: number, width: number, height: number, frameWidth: number, frameHeight: number) {
  const limitX = Math.max(0, (width * scale - frameWidth) / 2);
  const limitY = Math.max(0, (height * scale - frameHeight) / 2);
  const ratio = scale / previousScale;
  return {
    limitX, limitY,
    x: Math.max(-limitX, Math.min(limitX, anchorX + (x - anchorX) * ratio)),
    y: Math.max(-limitY, Math.min(limitY, anchorY + (y - anchorY) * ratio)),
  };
}

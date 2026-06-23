/** Nº de partículas escalado por ancho de viewport y DPR (capado para móvil). */
export function particleCount(width: number, dpr: number): number {
  const base = width < 640 ? 120 : width < 1024 ? 240 : 360;
  const cappedDpr = Math.min(Math.max(dpr, 1), 2);
  return Math.round(base / cappedDpr);
}

import { HOUR } from "./time.ts";

export type ViewMode = "auto" | 4 | 8 | 12 | 24;
export const PIXELS_PER_HOUR = 140;

export function viewSpan(mode: ViewMode, width: number): number {
  return mode === "auto" ? Math.max(1, width) / PIXELS_PER_HOUR * HOUR : mode * HOUR;
}

// Keep the browsed moment at one quarter of the viewport when its size changes.
export function viewStart(anchor: number, span: number): number {
  return anchor - span / 4;
}

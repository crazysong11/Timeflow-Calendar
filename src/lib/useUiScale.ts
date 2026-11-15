import { useLayoutEffect, useState } from "react";

// CSS defines the scale. Read the same root size for timeline coordinate math;
// pointer positions and ResizeObserver widths remain in CSS pixels.
const readScale = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;

export function useUiScale(pinned: boolean, appearanceScale = 100) {
  const [scale, setScale] = useState(readScale);
  useLayoutEffect(() => {
    const update = () => setScale(readScale());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [pinned, appearanceScale]);
  return scale;
}

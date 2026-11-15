import { useLayoutEffect, useState } from "react";
import { loadAppearance, saveAppearance, type Appearance } from "./appearance";

export function useAppearance() {
  const [initial] = useState(loadAppearance);
  const [appearance, setValue] = useState(initial.value);
  const [appearanceError, setError] = useState(initial.error);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { root.dataset.theme = appearance.theme === "system" ? (system.matches ? "dark" : "light") : appearance.theme; };
    root.style.setProperty("--appearance-scale", String(appearance.scale / 100));
    apply();
    system.addEventListener("change", apply);
    return () => system.removeEventListener("change", apply);
  }, [appearance]);
  function setAppearance(next: Appearance) {
    setValue(next);
    try { saveAppearance(next); setError(""); }
    catch { setError("外观已应用；设置保存未完成，重新选择可重试。"); }
  }
  return { appearance, setAppearance, appearanceError };
}

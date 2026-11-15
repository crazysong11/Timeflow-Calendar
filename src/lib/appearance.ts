export interface Appearance {
  theme: "system" | "light" | "dark";
  scale: 90 | 100 | 110 | 120;
  desktopAgenda: boolean;
}
export const DEFAULT_APPEARANCE: Appearance = { theme: "system", scale: 100, desktopAgenda: true };
export const APPEARANCE_KEY = "timeflow.appearance.v1";
export function normalizeAppearance(value: unknown): Appearance {
  const item = (value && typeof value === "object" ? value : {}) as Partial<Appearance>;
  return {
    theme: item.theme === "light" || item.theme === "dark" ? item.theme : "system",
    scale: [90, 100, 110, 120].includes(item.scale ?? 0) ? item.scale! : 100,
    desktopAgenda: typeof item.desktopAgenda === "boolean" ? item.desktopAgenda : true,
  };
}
export function loadAppearance(): { value: Appearance; error: string } {
  try { return { value: normalizeAppearance(JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? "null")), error: "" }; }
  catch { return { value: { ...DEFAULT_APPEARANCE }, error: "外观设置读取未完成，当前使用默认外观。" }; }
}
export function saveAppearance(value: Appearance) {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(normalizeAppearance(value)));
}

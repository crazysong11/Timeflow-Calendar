import test from "node:test";
import assert from "node:assert/strict";
import { APPEARANCE_KEY, DEFAULT_APPEARANCE, loadAppearance, normalizeAppearance, saveAppearance } from "../src/lib/appearance.ts";

test("外观设置验证范围并兼容缺失字段", () => {
  assert.deepEqual(normalizeAppearance(null), DEFAULT_APPEARANCE);
  assert.deepEqual(normalizeAppearance({ theme: "dark", scale: 90, desktopAgenda: false }), { theme: "dark", scale: 90, desktopAgenda: false });
  assert.deepEqual(normalizeAppearance({ theme: "invalid", scale: -100, desktopAgenda: "false" }), DEFAULT_APPEARANCE);
  assert.deepEqual(normalizeAppearance({ theme: "light" }), { ...DEFAULT_APPEARANCE, theme: "light" });
});
test("外观持久保存，损坏和读写失败可见且不覆盖原值", () => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  } });
  try {
    const appearance = { theme: "dark", scale: 120, desktopAgenda: false } as const;
    saveAppearance(appearance);
    assert.deepEqual(loadAppearance(), { value: appearance, error: "" });
    localStorage.setItem = () => { throw Error("quota"); };
    assert.throws(() => saveAppearance(DEFAULT_APPEARANCE));
    assert.deepEqual(loadAppearance().value, appearance);
    data.set(APPEARANCE_KEY, "{bad");
    assert.ok(loadAppearance().error);
    assert.equal(data.get(APPEARANCE_KEY), "{bad");
  } finally { Reflect.deleteProperty(globalThis, "localStorage"); }
});

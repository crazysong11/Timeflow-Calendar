import test from "node:test";
import assert from "node:assert/strict";
import { HOUR, timeToX, xToTime } from "../src/lib/time.ts";
import { PIXELS_PER_HOUR, viewSpan, viewStart } from "../src/lib/viewport.ts";

test("自动视野在不同窗口宽度下保持小时宽度和浏览锚点", () => {
  const anchor = new Date("2026-12-31T23:40:00").getTime();
  let previousSpan = 0;
  for (const width of [560, 980, 1800, 2500, 3726]) {
    const span = viewSpan("auto", width);
    const start = viewStart(anchor, span);
    assert.ok(span > previousSpan);
    assert.ok(Math.abs(timeToX(anchor, start, span, width) - width / 4) < 0.001);
    assert.ok(Math.abs(timeToX(start + HOUR, start, span, width) - PIXELS_PER_HOUR) < 0.001);
    // A 140-pixel drag always browses one hour, including after resizing.
    assert.ok(Math.abs(xToTime(140, start, span, width) - start - HOUR) < 0.001);
    previousSpan = span;
  }
});

test("固定视野保持选定时长，切换模式保留已浏览的时刻", () => {
  const browsedAnchor = new Date("2027-01-02T10:15:00").getTime();
  for (const width of [560, 980, 1800]) {
    for (const mode of ["auto", 4, 8, 12, 24] as const) {
      const span = viewSpan(mode, width);
      if (mode !== "auto") assert.equal(span, mode * HOUR);
      assert.equal(viewStart(browsedAnchor, span) + span / 4, browsedAnchor);
    }
  }
});

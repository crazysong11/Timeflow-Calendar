import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { HOUR, MINUTE, dateSegments, hourTicks, localInput, parseLocalInput, layoutEvents, inRange, timeToX, xToTime, validateEvent, type CalendarEvent } from "../src/lib/time.ts";
import { SELECT_EVENTS, SAVE_EVENT, DELETE_EVENT, eventValues, listEvents, saveEvent, deleteEvent } from "../src/lib/storage.ts";

const event = (id: string, start: number, end: number): CalendarEvent => ({
  id, title: "阅读", start, end, notes: "", color: "sage", createdAt: 1, updatedAt: 1,
});
const instant = (text: string) => new Date(text).getTime();

test("相邻小时跨午夜、跨月、跨年保持等距，坐标可逆", () => {
  for (const date of ["2026-11-15", "2026-11-30", "2026-12-31"]) {
    const start = instant(date + "T22:00:00");
    const ticks = hourTicks(start, start + 4 * HOUR);
    assert.equal(ticks.length, 5);
    for (let i = 1; i < ticks.length; i++) {
      assert.equal(ticks[i] - ticks[i - 1], HOUR);
      assert.equal(timeToX(ticks[i], start, 4 * HOUR, 800) - timeToX(ticks[i - 1], start, 4 * HOUR, 800), 200);
    }
    assert.equal(dateSegments(start, start + 4 * HOUR).length, 2);
    const exact = start + 37 * MINUTE;
    assert.equal(xToTime(timeToX(exact, start, 4 * HOUR, 800), start, 4 * HOUR, 800), exact);
  }
});

test("精确到分钟，拒绝不存在的日期与倒置区间", () => {
  const start = parseLocalInput("2026-11-15T10:35");
  const end = parseLocalInput("2026-11-15T11:05");
  assert.equal(end - start, 30 * MINUTE);
  assert.equal(localInput(start), "2026-11-15T10:35");
  assert.ok(Number.isNaN(parseLocalInput("2026-02-30T10:00")));
  assert.ok(Number.isNaN(parseLocalInput("")));
  assert.equal(validateEvent(event("valid", start, end)), null);
  assert.ok(validateEvent(event("invalid", end, start)));
  assert.ok(validateEvent({ ...event("blank", start, end), title: " " }));
});

test("重叠事项分行，首尾相接复用同一行，跨天事项保持一个对象", () => {
  const start = instant("2026-12-31T23:30:00");
  const items = [event("a", start, start + HOUR), event("b", start + 10 * MINUTE, start + 30 * MINUTE), event("c", start + HOUR, start + 2 * HOUR)];
  const result = layoutEvents(items);
  assert.deepEqual(result.map(({ lane }) => lane), [0, 1, 0]);
  assert.equal(result[0].event, items[0]);
  assert.equal(items[0].end - items[0].start, HOUR);
  assert.ok(inRange(items[0], start + 15 * MINUTE, start + 45 * MINUTE));
  assert.ok(!inRange(items[0], start + HOUR, start + 2 * HOUR));
});

test("夏令时日期带采用本地午夜边界，小时按真实时长推进", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    for (const [date, nextDate, length] of [["2026-03-08", "2026-03-09", 23], ["2026-11-01", "2026-11-02", 25]] as const) {
      const start = instant(date + "T00:00:00");
      const end = instant(nextDate + "T00:00:00");
      const segments = dateSegments(start, end);
      assert.equal(segments.length, 1);
      assert.equal(segments[0].end - segments[0].start, length * HOUR);
      const ticks = hourTicks(start, end);
      assert.equal(ticks.length, length + 1);
      for (let i = 1; i < ticks.length; i++) assert.equal(ticks[i] - ticks[i - 1], HOUR);
    }
    assert.ok(Number.isNaN(parseLocalInput("2026-03-08T02:30")));
    const repeated = hourTicks(instant("2026-11-01T00:00:00"), instant("2026-11-01T03:00:00"));
    assert.equal(repeated.filter((time) => new Date(time).getHours() === 1).length, 2);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("SQLite 实际迁移、跨天查询、编辑与删除在重新打开后保持一致", () => {
  const directory = mkdtempSync(join(tmpdir(), "timeflow-test-"));
  const path = join(directory, "events.db");
  let db = new DatabaseSync(path);
  const bind = (values: (string | number)[]) => Object.fromEntries(values.map((value, index) => ["$" + (index + 1), value]));
  try {
    db.exec(readFileSync(new URL("../src-tauri/migrations/001_events.sql", import.meta.url), "utf8"));
    db.exec("INSERT INTO events VALUES ('legacy','旧事项',1,2,'','sage',1,1)");
    db.exec(readFileSync(new URL("../src-tauri/migrations/002_completed.sql", import.meta.url), "utf8"));
    assert.equal(db.prepare("SELECT completed FROM events WHERE id='legacy'").get()?.completed, 0);
    db.exec("DELETE FROM events WHERE id='legacy'");
    const start = instant("2026-12-31T23:30:00");
    const item = { ...event("across-midnight", start, start + HOUR), title: "阅读 ' SQL 文本", notes: "跨年安排" };
    db.prepare(SAVE_EVENT).run(bind(eventValues(item)));
    db.close();
    db = new DatabaseSync(path);
    const rows = db.prepare(SELECT_EVENTS).all(bind([start + 45 * MINUTE, start + 15 * MINUTE]));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, item.title);
    assert.equal(rows[0].end, item.end);
    assert.equal(db.prepare(SELECT_EVENTS).all(bind([start + 2 * HOUR, start + HOUR])).length, 0);
    const updated = { ...item, title: "修改后的事项", end: start + 2 * HOUR, completed: true, updatedAt: 2 };
    db.prepare(SAVE_EVENT).run(bind(eventValues(updated)));
    assert.throws(() => db.prepare(SAVE_EVENT).run(bind(eventValues({ ...item, id: "invalid", end: start }))));
    db.close();
    db = new DatabaseSync(path);
    assert.equal(db.prepare(SELECT_EVENTS).all(bind([start + 3 * HOUR, start]))[0].title, updated.title);
    assert.equal(db.prepare(SELECT_EVENTS).all(bind([start + 3 * HOUR, start]))[0].completed, 1);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM events").get()?.count, 1);
    db.prepare(DELETE_EVENT).run({ $1: item.id });
    db.close();
    db = new DatabaseSync(path);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM events").get()?.count, 0);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("浏览器预览保存独立，损坏数据和写入失败不会被静默覆盖", async () => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  try {
    const item = event("preview", 1000, 2000);
    await saveEvent(item);
    assert.equal((await listEvents(1200, 1800)).length, 1);
    assert.equal((await listEvents(1200, 1800))[0].completed, false);
    await saveEvent({ ...item, title: "已修改", completed: true });
    assert.equal((await listEvents(1200, 1800))[0].completed, true);
    assert.equal((await listEvents(1200, 1800))[0].title, "已修改");
    localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
    await assert.rejects(saveEvent({ ...item, title: "写入失败" }));
    assert.equal((await listEvents(1200, 1800))[0].title, "已修改");
    localStorage.setItem = (key, value) => { data.set(key, value); };
    await deleteEvent(item.id);
    assert.equal((await listEvents(0, 3000)).length, 0);
    data.set("timeflow.preview.events.v1", "{broken");
    await assert.rejects(saveEvent(item));
    assert.equal(data.get("timeflow.preview.events.v1"), "{broken");
  } finally {
    Reflect.deleteProperty(globalThis, "localStorage");
    Reflect.deleteProperty(globalThis, "window");
  }
});

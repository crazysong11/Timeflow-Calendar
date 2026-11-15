import test from "node:test";
import assert from "node:assert/strict";
import { adjustedEvent, EventHistory } from "../src/lib/eventChanges.ts";
import { HOUR, MINUTE, type CalendarEvent } from "../src/lib/time.ts";

const event: CalendarEvent = { id: "a", title: "跨午夜阅读", start: new Date("2026-12-31T23:37:00").getTime(), end: new Date("2027-01-01T00:37:00").getTime(), color: "sage", notes: "", createdAt: 1, updatedAt: 1 };
test("拖动跨午夜保持时长，两个边缘分别调整且最短一分钟", () => {
  for (const width of [87.5, 105, 140]) {
    const moved = adjustedEvent(event, "move", width, width * 8, HOUR * 8);
    assert.equal(moved.start, event.start + HOUR);
    assert.equal(moved.end - moved.start, HOUR);
    assert.equal(adjustedEvent(event, "start", width * 2, width * 8, HOUR * 8).start, event.end - MINUTE);
    assert.equal(adjustedEvent(event, "end", -width * 2, width * 8, HOUR * 8).end, event.start + MINUTE);
    assert.equal(adjustedEvent(event, "move", width * 7 / 60, width * 8, HOUR * 8).start, event.start + 5 * MINUTE);
    assert.equal(adjustedEvent(event, "move", width * 7 / 60, width * 8, HOUR * 8, true).start, event.start + 7 * MINUTE);
  }
});
function fixture() {
  const rows = new Map<string, CalendarEvent>();
  let fail = false;
  const history = new EventHistory({
    read: async id => rows.get(id) ?? null,
    save: async e => { if (fail) throw Error("disk full"); rows.set(e.id, { ...e }); },
    remove: async id => { if (fail) throw Error("disk full"); rows.delete(id); },
  });
  return { rows, history, failure: (value: boolean) => { fail = value; } };
}
test("新增、移动、完成、删除可逐步撤销，恢复原时间和完成状态", async () => {
  const { rows, history } = fixture();
  await history.execute(event, event.id);
  await history.execute({ ...event, start: event.start + HOUR, end: event.end + HOUR }, event.id);
  await history.execute({ ...rows.get(event.id)!, completed: true }, event.id);
  await history.execute(null, event.id);
  assert.equal(rows.size, 0);
  await history.undo(); assert.equal(rows.get(event.id)?.completed, true);
  await history.undo(); assert.equal(!!rows.get(event.id)?.completed, false);
  await history.undo(); assert.equal(rows.get(event.id)?.start, event.start);
  await history.undo(); assert.equal(rows.size, 0);
  assert.equal(history.count, 0);
});
test("写入失败保持原数据和撤销记录，无变化不入栈，记录独立于调用者对象", async () => {
  const { rows, history, failure } = fixture();
  const next = { ...event };
  await history.execute(next, next.id); next.title = "调用者修改";
  assert.equal(rows.get(event.id)?.title, event.title);
  await history.execute({ ...event, completed: false, updatedAt: 99 }, event.id);
  assert.equal(history.count, 1);
  failure(true);
  await assert.rejects(history.execute(null, event.id));
  await assert.rejects(history.undo());
  assert.equal(history.count, 1); assert.equal(rows.size, 1);
  failure(false); await history.undo(); assert.equal(rows.size, 0);
});
test("异步写入期间串行保护，最多保留最近五十步", async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const history = new EventHistory({ read: async () => null, save: async () => pending, remove: async () => {} });
  const first = history.execute(event, event.id);
  await assert.rejects(history.execute(event, event.id));
  await assert.rejects(history.undo());
  release(); await first;
  const other = fixture();
  for (let n = 0; n < 55; n++) await other.history.execute({ ...event, title: "事项" + n }, event.id);
  assert.equal(other.history.count, 50);
});

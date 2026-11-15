import { MINUTE, type CalendarEvent } from "./time.ts";

export type GestureKind = "move" | "start" | "end";
export function adjustedEvent(event: CalendarEvent, kind: GestureKind, pixels: number, width: number, span: number, fine = false): CalendarEvent {
  const step = (fine ? 1 : 5) * MINUTE;
  const delta = Math.round(pixels / Math.max(1, width) * span / step) * step;
  if (kind === "move") return { ...event, start: event.start + delta, end: event.end + delta };
  if (kind === "start") return { ...event, start: Math.min(event.end - MINUTE, event.start + delta) };
  return { ...event, end: Math.max(event.start + MINUTE, event.end + delta) };
}

export interface EventChange { before: CalendarEvent | null; after: CalendarEvent | null }
interface Repository {
  read: (id: string) => Promise<CalendarEvent | null>;
  save: (event: CalendarEvent) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
const copy = (event: CalendarEvent | null) => event ? { ...event } : null;
const same = (a: CalendarEvent | null, b: CalendarEvent | null) => a === b || !!(a && b &&
  a.id === b.id && a.title === b.title && a.start === b.start && a.end === b.end &&
  a.notes === b.notes && a.color === b.color && !!a.completed === !!b.completed);

// Record only successful writes; a failed undo stays available for retry.
export class EventHistory {
  private entries: EventChange[] = [];
  busy = false;
  private repository: Repository;
  constructor(repository: Repository) { this.repository = repository; }
  get count() { return this.entries.length; }
  private async write(event: CalendarEvent | null, id: string) {
    if (event) await this.repository.save(event);
    else await this.repository.remove(id);
  }
  async execute(after: CalendarEvent | null, id: string): Promise<EventChange | null> {
    if (this.busy) throw new Error("正在保存，请稍候再操作。");
    this.busy = true;
    try {
      const before = copy(await this.repository.read(id));
      const next = copy(after);
      if (same(before, next)) return null;
      await this.write(next, id);
      const change = { before, after: next };
      this.entries = [...this.entries.slice(-49), change];
      return change;
    } finally { this.busy = false; }
  }
  async undo(): Promise<EventChange | null> {
    if (this.busy) throw new Error("正在保存，请稍候再操作。");
    const entry = this.entries.at(-1);
    if (!entry) return null;
    this.busy = true;
    try {
      const restored = entry.before ? { ...entry.before, updatedAt: Date.now() } : null;
      await this.write(restored, (entry.after ?? entry.before)!.id);
      this.entries.pop();
      return { before: copy(entry.after), after: restored };
    } finally { this.busy = false; }
  }
}

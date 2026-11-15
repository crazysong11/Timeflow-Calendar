import { isTauri } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { inRange, validateEvent, type CalendarEvent } from "./time.ts";

export const SELECT_EVENTS = `SELECT id, title, start_ms AS start, end_ms AS end, notes, color,
  created_at AS createdAt, updated_at AS updatedAt FROM events
  WHERE start_ms < $1 AND end_ms > $2 ORDER BY start_ms, id`;
export const SAVE_EVENT = `INSERT INTO events (id, title, start_ms, end_ms, notes, color, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  ON CONFLICT(id) DO UPDATE SET title=excluded.title, start_ms=excluded.start_ms,
  end_ms=excluded.end_ms, notes=excluded.notes, color=excluded.color, updated_at=excluded.updated_at`;
export const DELETE_EVENT = "DELETE FROM events WHERE id = $1";
const PREVIEW_KEY = "timeflow.preview.events.v1";
let connection: Promise<Database> | undefined;

function database(): Promise<Database> {
  connection ??= Database.load("sqlite:timeflow.db").catch((error) => {
    connection = undefined;
    throw error;
  });
  return connection;
}

export function eventValues(event: CalendarEvent): (string | number)[] {
  return [event.id, event.title.trim(), event.start, event.end, event.notes, event.color, event.createdAt, event.updatedAt];
}

function previewEvents(): CalendarEvent[] {
  const value: unknown = JSON.parse(localStorage.getItem(PREVIEW_KEY) ?? "[]");
  if (!Array.isArray(value) || !value.every((e) => e && typeof e.id === "string" && typeof e.title === "string" && typeof e.notes === "string" && typeof e.color === "string" && Number.isSafeInteger(e.createdAt) && Number.isSafeInteger(e.updatedAt) && !validateEvent(e))) {
    throw new Error("浏览器预览数据格式异常，请保留数据后检查浏览器存储。");
  }
  return value;
}

export async function listEvents(start: number, end: number): Promise<CalendarEvent[]> {
  if (isTauri()) return (await database()).select<CalendarEvent[]>(SELECT_EVENTS, [end, start]);
  return previewEvents().filter((event) => inRange(event, start, end));
}

export async function saveEvent(event: CalendarEvent): Promise<void> {
  const error = validateEvent(event);
  if (error) throw new Error(error);
  if (isTauri()) {
    await (await database()).execute(SAVE_EVENT, eventValues(event));
  } else {
    const events = previewEvents().filter((item) => item.id !== event.id);
    localStorage.setItem(PREVIEW_KEY, JSON.stringify([...events, { ...event, title: event.title.trim() }]));
  }
}

export async function deleteEvent(id: string): Promise<void> {
  if (isTauri()) await (await database()).execute(DELETE_EVENT, [id]);
  else localStorage.setItem(PREVIEW_KEY, JSON.stringify(previewEvents().filter((event) => event.id !== id)));
}

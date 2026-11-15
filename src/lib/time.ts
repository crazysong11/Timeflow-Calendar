export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export interface CalendarEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  notes: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export const COLORS = ["sage", "blue", "peach", "lavender"] as const;
export const COLOR_NAMES = ["青绿", "湖蓝", "暖橙", "浅紫"];
const pad = (value: number) => String(value).padStart(2, "0");

export function dateInput(time: number): string {
  const d = new Date(time);
  return `${String(d.getFullYear()).padStart(4, "0")}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function localInput(time: number): string {
  const d = new Date(time);
  return `${dateInput(time)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseLocalInput(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return NaN;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && localInput(time) === value ? time : NaN;
}

export function clockTime(time: number): string {
  const d = new Date(time);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateLabel(time: number): string {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(time);
}

export function eventTime(event: Pick<CalendarEvent, "start" | "end">): string {
  const start = clockTime(event.start);
  return dateInput(event.start) === dateInput(event.end)
    ? `${start} – ${clockTime(event.end)}`
    : `${new Date(event.start).getMonth() + 1}/${new Date(event.start).getDate()} ${start} – ${new Date(event.end).getMonth() + 1}/${new Date(event.end).getDate()} ${clockTime(event.end)}`;
}

export function durationLabel(duration: number): string {
  const minutes = Math.round(duration / MINUTE);
  const hours = Math.floor(minutes / 60);
  return [hours ? `${hours} 小时` : "", minutes % 60 ? `${minutes % 60} 分钟` : ""].filter(Boolean).join(" ") || "不足 1 分钟";
}

export function validateEvent(event: Pick<CalendarEvent, "title" | "start" | "end" | "notes" | "color">): string | null {
  if (!event.title.trim()) return "给这件事起个名字吧。";
  if (event.title.trim().length > 120) return "标题请控制在 120 个字以内。";
  if (![event.start, event.end].every((time) => Number.isSafeInteger(time) && Number.isFinite(new Date(time).getTime()))) return "请选择有效的开始和结束时间。";
  if (event.end <= event.start) return "结束时间需要晚于开始时间；跨天事项请选择次日的日期。";
  if (event.notes.length > 4000) return "备注请控制在 4000 个字以内。";
  if (!(COLORS as readonly string[]).includes(event.color)) return "请选择一种事项颜色。";
  return null;
}

export function timeToX(time: number, start: number, span: number, width: number): number {
  return ((time - start) / span) * width;
}

export function xToTime(x: number, start: number, span: number, width: number): number {
  return start + (x / width) * span;
}

export function hourTicks(start: number, end: number): number[] {
  const first = new Date(start);
  first.setMinutes(0, 0, 0);
  const ticks: number[] = [];
  for (let time = first.getTime(); time <= end; time += HOUR) {
    if (time >= start) ticks.push(time);
  }
  return ticks;
}

export function dateSegments(start: number, end: number): { start: number; end: number; date: number }[] {
  const segments = [];
  const first = new Date(start);
  first.setHours(0, 0, 0, 0);
  let date = first.getTime();
  while (date < end) {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const next = d.getTime();
    segments.push({ start: Math.max(date, start), end: Math.min(next, end), date });
    date = next;
  }
  return segments;
}

export function inRange(event: Pick<CalendarEvent, "start" | "end">, start: number, end: number): boolean {
  return event.start < end && event.end > start;
}

export function layoutEvents(events: CalendarEvent[]): { event: CalendarEvent; lane: number }[] {
  const laneEnds: number[] = [];
  return [...events].sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id)).map((event) => {
    let lane = laneEnds.findIndex((end) => end <= event.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = event.end;
    return { event, lane };
  });
}

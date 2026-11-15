import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { adjustedEvent, type GestureKind } from "../lib/eventChanges";
import { dateInput, eventTime, timeToX, type CalendarEvent } from "../lib/time";

interface Props {
  event: CalendarEvent; lane: number; start: number; span: number; width: number; uiScale: number; disabled: boolean;
  onEdit: (event: CalendarEvent) => void;
  onChange: (event: CalendarEvent) => Promise<void>;
  onContextMenu: (e: MouseEvent<HTMLElement>, event: CalendarEvent) => void;
}
export default function EventCard({ event, lane, start, span, width, uiScale, disabled, onEdit, onChange, onContextMenu }: Props) {
  const button = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ id: number; x: number; kind: GestureKind; original: CalendarEvent; width: number; span: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [preview, setPreview] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const shown = preview ?? event;
  const left = Math.max(0, timeToX(shown.start, start, span, width));
  const right = Math.min(width, timeToX(shown.end, start, span, width));
  const clippedStart = shown.start < start, clippedEnd = shown.end > start + span;

  function cancel() {
    const current = gesture.current;
    gesture.current = null;
    setPreview(null);
    if (current && button.current?.hasPointerCapture(current.id)) button.current.releasePointerCapture(current.id);
  }
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (gesture.current && (e.key === "Escape" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z"))) {
        e.preventDefault(); e.stopPropagation(); cancel();
      }
    };
    window.addEventListener("keydown", escape, true);
    window.addEventListener("resize", cancel);
    return () => { window.removeEventListener("keydown", escape, true); window.removeEventListener("resize", cancel); };
  }, []);

  function begin(e: PointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (e.button !== 0 || disabled || saving) return;
    suppressClick.current = false;
    setError("");
    const edge = (e.target as HTMLElement).closest<HTMLElement>("[data-edge]")?.dataset.edge as GestureKind | undefined;
    gesture.current = { id: e.pointerId, x: e.clientX, kind: edge ?? "move", original: event, width, span, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    const current = gesture.current;
    if (!current || current.id !== e.pointerId) return;
    const distance = e.clientX - current.x;
    if (Math.abs(distance) > 4) { current.moved = true; suppressClick.current = true; }
    if (current.moved) setPreview(adjustedEvent(current.original, current.kind, distance, current.width, current.span, e.shiftKey));
  }
  async function finish(e: PointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    const current = gesture.current;
    if (!current || current.id !== e.pointerId) return;
    const next = adjustedEvent(current.original, current.kind, e.clientX - current.x, current.width, current.span, e.shiftKey);
    gesture.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!current.moved || (next.start === event.start && next.end === event.end)) { setPreview(null); return; }
    setPreview(next);
    setSaving(true);
    try { await onChange({ ...next, updatedAt: Date.now() }); }
    catch { setError("时间调整未保存，请重试。"); }
    finally { setSaving(false); setPreview(null); }
  }
  return <>
    <button ref={button} className={"timeline-event " + event.color + (right - left < 50 * uiScale ? " compact-event" : "") +
      (clippedStart ? " continues-before" : "") + (clippedEnd ? " continues-after" : "") + (event.completed ? " event-completed" : "") + (preview ? " event-adjusting" : "")}
      style={{ left, width: Math.max(2, right - left), top: `calc(7.25rem + ${lane} * var(--event-row))` }}
      title={event.title + "\n" + dateInput(shown.start) + " " + eventTime(shown) + "\n拖动移动 · 拖动两端调整时长 · Shift 精调 · Esc 取消"}
      aria-label={"编辑 " + event.title + "，" + eventTime(shown) + (event.completed ? "，已完成" : "")}
      aria-disabled={disabled || saving}
      onPointerDown={begin} onPointerMove={move} onPointerUp={(e) => void finish(e)}
      onPointerCancel={(e) => { e.stopPropagation(); cancel(); }}
      onLostPointerCapture={() => { if (gesture.current) cancel(); }}
      onDoubleClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => { cancel(); if (!disabled && !saving) onContextMenu(e, event); else e.preventDefault(); }}
      onClick={(e) => { if (suppressClick.current) { suppressClick.current = false; e.preventDefault(); return; } if (!disabled && !saving) onEdit(event); }}>
      {!clippedStart && right - left >= 24 && <span className="event-edge start-edge" data-edge="start" aria-hidden="true" title="拖动调整开始时间" />}
      <strong>{event.completed ? "✓ " : ""}{clippedStart ? "← " : ""}{event.title}{clippedEnd ? " →" : ""}</strong>
      <span className="event-time">{eventTime(shown)}</span>
      {!clippedEnd && right - left >= 24 && <span className="event-edge end-edge" data-edge="end" aria-hidden="true" title="拖动调整结束时间" />}
    </button>
    {(preview || error) && createPortal(<div className="gesture-feedback" role="status">{error || `${dateInput(shown.start)} ${eventTime(shown)}${saving ? " · 正在保存…" : " · 松开保存，Esc 取消"}`}</div>, document.body)}
  </>;
}

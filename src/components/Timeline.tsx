import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { HOUR, MINUTE, clockTime, dateInput, dateLabel, dateSegments, eventTime, hourTicks, layoutEvents, timeToX, xToTime, type CalendarEvent } from "../lib/time";

interface Props {
  start: number; span: number; now: number; events: CalendarEvent[]; loading: boolean;
  onBrowse: (start: number) => void;
  onCreate: (time: number) => void;
  onEdit: (event: CalendarEvent) => void;
}

export default function Timeline({ start, span, now, events, loading, onBrowse, onCreate, onEdit }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; start: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(900);
  const [hover, setHover] = useState<number | null>(null);
  const end = start + span;
  const ticks = useMemo(() => hourTicks(start, end), [start, end]);
  const dates = useMemo(() => dateSegments(start, end), [start, end]);
  const layout = useMemo(() => layoutEvents(events), [events]);
  const lanes = Math.max(2, ...layout.map(({ lane }) => lane + 1));
  const height = Math.max(310, 115 + lanes * 88);
  const x = (time: number) => timeToX(time, start, span, width);
  const nowX = x(now);
  const labelStep = Math.max(1, Math.ceil(52 / (width / (span / HOUR))));

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(surface.current!);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = surface.current!;
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      // Keep vertical scrolling available when overlapping events need more rows.
      if (!horizontal && !e.shiftKey && element.scrollHeight > element.clientHeight) return;
      const delta = horizontal ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      const pixels = delta * (e.deltaMode === 1 ? 24 : e.deltaMode === 2 ? width : 1);
      onBrowse(start + (pixels / width) * span);
      setHover(null);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [start, span, width, onBrowse]);

  function pointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    drag.current = { id: e.pointerId, x: e.clientX, start, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
  }

  function pointerMove(e: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (current?.id === e.pointerId) {
      const distance = e.clientX - current.x;
      if (Math.abs(distance) > 4) { current.moved = true; setDragging(true); }
      if (current.moved) { onBrowse(current.start - (distance / width) * span); setHover(null); }
    } else {
      const bounds = e.currentTarget.getBoundingClientRect();
      setHover(xToTime(e.clientX - bounds.left, start, span, width));
    }
  }

  function stopDrag(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div ref={surface} className={"timeline-surface " + (dragging ? "dragging" : "")}
      role="region" aria-label="连续时间轴，左右方向键浏览，双击空白处创建事项" tabIndex={0}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={stopDrag}
      onPointerCancel={stopDrag} onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
      onPointerLeave={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onBrowse(start + (e.key === "ArrowLeft" ? -1 : 1) * HOUR);
        }
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        const time = xToTime(e.clientX - bounds.left, start, span, width);
        onCreate(Math.round(time / (5 * MINUTE)) * 5 * MINUTE);
      }}>
      <div className="timeline-canvas" style={{ height }}>
        <div className="elapsed-shade" style={{ width: Math.max(0, Math.min(width, nowX)) }} />
        {dates.map((segment) => <div className="date-band" key={segment.date} style={{ left: x(segment.start), width: x(segment.end) - x(segment.start) }}>
          <span title={dateInput(segment.date)}>{dateInput(segment.date) === dateInput(now) && <b>今天</b>}{dateLabel(segment.date)}</span>
        </div>)}
        {ticks.map((tick) => <div key={tick} className={"hour-line " + (new Date(tick).getHours() === 0 ? "midnight" : "")} style={{ left: x(tick) }}>
          {new Date(tick).getHours() % labelStep === 0 && <span className="hour-label" title={new Date(tick).toString()}>{clockTime(tick)}</span>}
        </div>)}
        {ticks.filter((tick) => tick + HOUR / 2 < end).map((tick) => <div key={tick} className="half-tick" style={{ left: x(tick + HOUR / 2) }} />)}
        {hover !== null && !dragging && <div className="hover-line" style={{ left: Math.min(width - 1, Math.max(0, x(hover))) }}><span>{clockTime(hover)}</span></div>}
        {layout.map(({ event, lane }) => {
          const left = Math.max(0, x(event.start));
          const right = Math.min(width, x(event.end));
          const clippedStart = event.start < start;
          const clippedEnd = event.end > end;
          return <button key={event.id} className={"timeline-event " + event.color + (right - left < 50 ? " compact-event" : "") + (clippedStart ? " continues-before" : "") + (clippedEnd ? " continues-after" : "")}
            style={{ left, width: Math.max(2, right - left), top: 106 + lane * 88 }}
            title={event.title + "\n" + dateInput(event.start) + " " + eventTime(event) + (event.notes ? "\n" + event.notes : "")}
            aria-label={"编辑 " + event.title + "，" + eventTime(event)}
            onClick={() => onEdit(event)}>
            <strong>{clippedStart ? "← " : ""}{event.title}{clippedEnd ? " →" : ""}</strong>
            <span>{eventTime(event)}</span>
          </button>;
        })}
        {!events.length && !loading && <div className="timeline-empty">
          <span className="empty-mark" aria-hidden="true">＋</span>
          <p>把接下来的时间，留给想做的事</p><span>双击空白处，安排第一件事</span>
        </div>}
        {nowX >= 0 && nowX < width && <div className="now-line" style={{ left: nowX }}><span className="now-label">{clockTime(now)} 此刻</span><i /></div>}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import EventEditor from "./components/EventEditor";
import Timeline from "./components/Timeline";
import { deleteEvent, listEvents, saveEvent } from "./lib/storage";
import { HOUR, MINUTE, clockTime, dateInput, dateLabel, durationLabel, eventTime, inRange, parseLocalInput, type CalendarEvent } from "./lib/time";

const desktop = isTauri();

export default function App() {
  const [now, setNow] = useState(Date.now);
  const [hours, setHours] = useState(8);
  const span = hours * HOUR;
  const [start, setStart] = useState(() => Date.now() - 2 * HOUR);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ event: CalendarEvent | null; start: number } | null>(null);
  const [jumpDate, setJumpDate] = useState(() => dateInput(Date.now()));
  const end = start + span;
  const visibleEvents = useMemo(() => events.filter((event) => inRange(event, start, end)).sort((a, b) => a.start - b.start || a.id.localeCompare(b.id)), [events, start, end]);
  const dateRange = dateInput(start) === dateInput(end - 1) ? dateLabel(start) : dateLabel(start) + " — " + dateLabel(end - 1);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    const timer = window.setTimeout(() => {
      listEvents(start - span, end + span).then((result) => {
        if (active) { setEvents(result); setLoading(false); }
      }).catch(() => {
        if (active) { setLoadError("日程读取未完成，请重试。"); setLoading(false); }
      });
    }, 100);
    return () => { active = false; window.clearTimeout(timer); };
  }, [start, end, span, revision]);

  function backToNow() {
    const current = Date.now();
    setNow(current);
    setStart(current - span / 4);
    setJumpDate(dateInput(current));
  }

  function create(time?: number) {
    const current = Date.now();
    const target = time ?? (current >= start && current < end ? current : start + span / 4);
    setEditor({ event: null, start: Math.ceil(target / MINUTE) * MINUTE });
  }

  async function persist(event: CalendarEvent) {
    await saveEvent(event);
    setEvents((items) => [...items.filter((item) => item.id !== event.id), event]);
    setNotice("已保存「" + event.title + "」");
    if (!inRange(event, start, end)) setStart(event.start - span / 4);
    setRevision((value) => value + 1);
  }

  async function remove(id: string) {
    await deleteEvent(id);
    setEvents((items) => items.filter((event) => event.id !== id));
    setNotice("事项已删除");
    setRevision((value) => value + 1);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span>Timeflow <b>Calendar</b></span></div>
        <span className="storage-indicator"><i />{desktop ? "日程保存在此电脑" : "浏览器预览 · 数据保存在当前浏览器"}</span>
      </header>
      <section className="intro">
        <div><p className="eyebrow">MAKE ROOM FOR YOUR TIME</p><h1>从此刻，开始。</h1><p className="subtitle">时间一直向前，每一刻都可以是新的起点。</p></div>
        <div className="live-clock"><span>{clockTime(now)}</span><p>{dateLabel(now)}</p></div>
      </section>
      <section className="calendar" aria-label="流式日历">
        <div className="calendar-toolbar">
          <div className="range-heading"><p>{new Date(start).getFullYear()} <span>/ TIMEFLOW</span></p><h2>{dateRange}</h2></div>
          <div className="toolbar-actions">
            <button className="button" onClick={backToNow}><span className="now-dot" />回到现在</button>
            <button className="button primary" onClick={() => create()} disabled={loading || !!loadError}><span aria-hidden="true">＋</span> 新建事项</button>
          </div>
        </div>
        <div className="timeline-controls">
          <div className="browse-controls">
            <div className="arrow-group">
              <button className="icon-button" aria-label="向过去浏览" title="向过去浏览半屏" onClick={() => setStart(start - span / 2)}>‹</button>
              <button className="icon-button" aria-label="向未来浏览" title="向未来浏览半屏" onClick={() => setStart(start + span / 2)}>›</button>
            </div>
            <form className="date-jump" onSubmit={(e) => { e.preventDefault(); const target = parseLocalInput(jumpDate + "T08:00"); if (Number.isFinite(target)) setStart(target); }}>
              <label className="sr-only" htmlFor="jump-date">跳转日期</label>
              <input id="jump-date" type="date" value={jumpDate} required onInput={(e) => setJumpDate(e.currentTarget.value)} />
              <button className="text-button" type="submit">前往</button>
            </form>
          </div>
          <label className="zoom-control">视野 <select aria-label="显示时间范围" value={hours} onChange={(e) => {
            const next = Number(e.target.value);
            setStart(start + span / 4 - next * HOUR / 4);
            setHours(next);
          }}><option value={4}>4 小时</option><option value={8}>8 小时</option><option value={12}>12 小时</option><option value={24}>24 小时</option></select></label>
        </div>
        {loadError && <div className="load-error" role="alert">{loadError}<button className="text-button" onClick={() => setRevision((value) => value + 1)}>重新读取</button></div>}
        <Timeline start={start} span={span} now={now} events={visibleEvents} loading={loading || !!loadError}
          onBrowse={setStart} onCreate={(time) => { if (!loading && !loadError) create(time); }}
          onEdit={(event) => setEditor({ event, start: event.start })} />
        <footer className="timeline-footer"><span>拖动空白处浏览 · 双击安排事项 · 方向键微调</span><span>{loading ? "正在读取…" : "本地时间 · " + zone}</span></footer>
      </section>
      <section className="agenda" aria-labelledby="agenda-title">
        <div className="agenda-heading"><h2 id="agenda-title">这段时间的安排 <span>{visibleEvents.length}</span></h2><span>{clockTime(start)} — {clockTime(end)}</span></div>
        {visibleEvents.length ? <div className="agenda-list">{visibleEvents.map((event) => <button key={event.id} className="agenda-item" onClick={() => setEditor({ event, start: event.start })}>
          <span className={"event-dot " + event.color} /><span className="agenda-time">{eventTime(event)}</span><strong>{event.title}</strong>
          <span className="agenda-duration">{durationLabel(event.end - event.start)}</span><span aria-hidden="true">↗</span>
        </button>)}</div> : <p className="agenda-empty">{loadError ? "重新读取后显示日程。" : loading ? "正在读取日程…" : "这里还留着一段空白，按自己的节奏安排就好。"}</p>}
      </section>
      <footer className="app-footer"><span>TIME FLOWS. YOU BEGIN.</span><span role="status">{notice || (desktop ? "每次保存后自动写入本地" : "桌面版与浏览器预览分别保存日程")}</span></footer>
      {editor && <EventEditor event={editor.event} start={editor.start} onSave={persist} onDelete={remove} onClose={() => setEditor(null)} />}
    </main>
  );
}

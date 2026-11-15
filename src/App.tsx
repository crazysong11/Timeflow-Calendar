import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import EventEditor from "./components/EventEditor";
import Timeline from "./components/Timeline";
import DesktopMode from "./components/DesktopMode";
import EventMenu, { type EventMenuTarget } from "./components/EventMenu";
import AppearanceSettings from "./components/AppearanceSettings";
import { useAppearance } from "./lib/useAppearance";
import { EventHistory, type EventChange } from "./lib/eventChanges";
import { viewSpan, viewStart, type ViewMode } from "./lib/viewport";
import { useUiScale } from "./lib/useUiScale";
import { deleteEvent, getEvent, listEvents, saveEvent } from "./lib/storage";
import { HOUR, MINUTE, clockTime, dateInput, dateLabel, durationLabel, eventTime, inRange, parseLocalInput, type CalendarEvent } from "./lib/time";

const desktop = isTauri();

export default function App() {
  const [now, setNow] = useState(Date.now);
  const [pinned, setPinned] = useState(false);
  const { appearance, setAppearance, appearanceError } = useAppearance();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("auto");
  const [width, setWidth] = useState(900);
  const [anchor, setAnchor] = useState(Date.now);
  const uiScale = useUiScale(pinned, appearance.scale);
  const span = viewSpan(viewMode, width, uiScale);
  const start = viewStart(anchor, span);
  const setStart = (value: number) => setAnchor(value + span / 4);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [history] = useState(() => new EventHistory({ read: getEvent, save: saveEvent, remove: deleteEvent }));
  const queryEpoch = useRef(0);
  const [menu, setMenu] = useState<EventMenuTarget | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
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
    const epoch = ++queryEpoch.current;
    setLoading(true);
    setLoadError("");
    const timer = window.setTimeout(() => {
      listEvents(start - span, end + span).then((result) => {
        if (active && epoch === queryEpoch.current) { setEvents(result); setLoading(false); }
      }).catch(() => {
        if (active && epoch === queryEpoch.current) { setLoadError("日程读取未完成，请重试。"); setLoading(false); }
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

  function applyChange(change: EventChange | null) {
    if (!change) return;
    ++queryEpoch.current;
    const id = (change.after ?? change.before)!.id;
    setEvents((items) => [...items.filter((item) => item.id !== id), ...(change.after ? [change.after] : [])]);
    setRevision((value) => value + 1);
  }
  async function change(next: CalendarEvent | null, id: string) {
    if (history.busy) throw new Error("正在保存，请稍候再操作。");
    setBusy(true); setActionError("");
    try {
      const result = await history.execute(next, id);
      applyChange(result);
      if (result) setNotice(next ? "已保存「" + next.title + "」" : "事项已删除，可撤销");
    } finally { setBusy(false); setUndoCount(history.count); }
  }
  async function persist(event: CalendarEvent) {
    await change(event, event.id);
    if (!inRange(event, start, end)) setStart(event.start - span / 4);
  }
  async function remove(id: string) { await change(null, id); }
  async function undo() {
    if (history.busy || !history.count || editor) return;
    setBusy(true); setActionError(""); closeMenu();
    try {
      const result = await history.undo();
      applyChange(result);
      const target = result?.after ?? result?.before;
      if (target && !inRange(target, start, end)) setStart(target.start - span / 4);
      setNotice("已撤销上一步操作");
    } catch { setActionError("撤销未完成，请重试。"); }
    finally { setBusy(false); setUndoCount(history.count); }
  }
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z" && !target.closest("input, textarea, select, [contenteditable], dialog")) {
        e.preventDefault(); void undo();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  function openMenu(e: MouseEvent<HTMLElement>, event: CalendarEvent) {
    e.preventDefault();
    if (busy || loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ event, source: e.currentTarget, x: e.clientX || rect.left, y: e.clientY || rect.bottom });
  }
  async function complete(event: CalendarEvent) {
    closeMenu();
    try { await change({ ...event, completed: !event.completed, updatedAt: Date.now() }, event.id); }
    catch { setActionError("完成状态未保存，请重试。"); }
  }

  return (
    <main className={"app-shell" + (pinned ? " desktop-mode" : "")}>
      <header className="app-header">
        <div className="brand"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span>Timeflow <b>Calendar</b></span></div>
        <div className="header-actions">
          <span className="storage-indicator"><i />{pinned ? "已固定在桌面" : desktop ? "日程保存在此电脑" : "浏览器预览 · 数据保存在当前浏览器"}</span>
          <button className="icon-button appearance-button" aria-label="外观设置" title="外观设置" onClick={() => { closeMenu(); setAppearanceOpen(true); }}>⚙</button>
          {desktop && <DesktopMode onChange={setPinned} onNotice={setNotice} />}
        </div>
      </header>
      <section className="intro">
        <div><p className="eyebrow">MAKE ROOM FOR YOUR TIME</p><h1>从此刻，开始。</h1><p className="subtitle">时间一直向前，每一刻都可以是新的起点。</p></div>
        <div className="live-clock"><span>{clockTime(now)}</span><p>{dateLabel(now)}</p></div>
      </section>
      <section className="calendar" aria-label="流式日历">
        <div className="calendar-toolbar">
          <div className="range-heading"><p>{new Date(start).getFullYear()} <span>/ TIMEFLOW</span></p><h2>{dateRange}</h2></div>
          <div className="toolbar-actions">
            <button className="icon-button undo-button" aria-label="撤销上一步操作" title={undoCount ? `撤销上一步操作（Ctrl+Z，剩余 ${undoCount} 步）` : "暂无可撤销操作"}
              disabled={!undoCount || busy || !!editor} onClick={() => void undo()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 4 10l5 5M4 10h9a7 7 0 0 1 7 7v2" /></svg>
            </button>
            <button className="button" onClick={backToNow}><span className="now-dot" />回到现在</button>
            <button className="button primary" onClick={() => create()} disabled={busy || loading || !!loadError}><span aria-hidden="true">＋</span> 新建事项</button>
          </div>
        </div>
        <div className="timeline-controls">
          <div className="browse-controls">
            <div className="arrow-group">
              <button className="icon-button" aria-label="向过去浏览" title="向过去浏览半屏" onClick={() => setStart(start - span / 2)}>‹</button>
              <button className="icon-button" aria-label="向未来浏览" title="向未来浏览半屏" onClick={() => setStart(start + span / 2)}>›</button>
            </div>
            <form className="date-jump" onSubmit={(e) => { e.preventDefault(); const target = parseLocalInput(jumpDate + "T00:00"); if (Number.isFinite(target)) setStart(target); }}>
              <label className="sr-only" htmlFor="jump-date">跳转日期</label>
              <input id="jump-date" type="date" value={jumpDate} required onInput={(e) => setJumpDate(e.currentTarget.value)} />
              <button className="text-button" type="submit">前往</button>
            </form>
          </div>
          <label className="zoom-control">视野 <select aria-label="显示时间范围" value={viewMode} onChange={(e) => {
            setViewMode(e.target.value === "auto" ? "auto" : Number(e.target.value) as ViewMode);
          }}><option value="auto">自动 · {(viewSpan("auto", width, uiScale) / HOUR).toFixed(1)} 小时</option><option value={4}>4 小时</option><option value={8}>8 小时</option><option value={12}>12 小时</option><option value={24}>24 小时</option></select></label>
        </div>
        {loadError && <div className="load-error" role="alert">{loadError}<button className="text-button" onClick={() => setRevision((value) => value + 1)}>重新读取</button></div>}
        {actionError && <div className="load-error" role="alert">{actionError}</div>}
        <Timeline start={start} span={span} now={now} width={width} uiScale={uiScale} onWidthChange={setWidth} events={visibleEvents} loading={loading || !!loadError}
          busy={busy} onChange={(event) => change(event, event.id)} onContextMenu={openMenu}
          onBrowse={setStart} onCreate={(time) => { if (!busy && !loading && !loadError) create(time); }}
          onEdit={(event) => setEditor({ event, start: event.start })} />
        <footer className="timeline-footer"><span>拖动事项改时间 · 两端调整时长 · 右键标记完成</span><span role="status">{busy ? "正在保存…" : loading ? "正在读取…" : notice || "本地时间 · " + zone}</span></footer>
      </section>
      {(!pinned || appearance.desktopAgenda) && <section className="agenda" aria-labelledby="agenda-title">
        <div className="agenda-heading"><h2 id="agenda-title">这段时间的安排 <span>{visibleEvents.length}</span></h2><span>{clockTime(start)} — {clockTime(end)}</span></div>
        {visibleEvents.length ? <div className="agenda-list">{visibleEvents.map((event) => <button key={event.id} className={"agenda-item" + (event.completed ? " event-completed" : "")} disabled={busy || loading} onContextMenu={(e) => openMenu(e, event)} onClick={() => setEditor({ event, start: event.start })}>
          <span className={"event-dot " + event.color} /><span className="agenda-time">{eventTime(event)}</span><strong>{event.completed ? "✓ " : ""}{event.title}</strong>
          <span className="agenda-duration">{durationLabel(event.end - event.start)}</span><span aria-hidden="true">↗</span>
        </button>)}</div> : <p className="agenda-empty">{loadError ? "重新读取后显示日程。" : loading ? "正在读取日程…" : "这里还留着一段空白，按自己的节奏安排就好。"}</p>}
      </section>}
      <footer className="app-footer"><span>TIME FLOWS. YOU BEGIN.</span><span role="status">{notice || (desktop ? "每次保存后自动写入本地" : "桌面版与浏览器预览分别保存日程")}</span></footer>
      {editor && <EventEditor event={editor.event} start={editor.start} onSave={persist} onDelete={remove} onClose={() => setEditor(null)} />}
      {menu && <EventMenu target={menu} onClose={closeMenu} onComplete={() => void complete(menu.event)} onEdit={() => { setEditor({ event: menu.event, start: menu.event.start }); closeMenu(); }} />}
      {appearanceOpen && <AppearanceSettings value={appearance} error={appearanceError} onChange={setAppearance} onClose={() => setAppearanceOpen(false)} />}
    </main>
  );
}

import { useEffect, useRef, useState, type FormEvent } from "react";
import { COLORS, COLOR_NAMES, HOUR, MINUTE, durationLabel, localInput, parseLocalInput, validateEvent, type CalendarEvent } from "../lib/time";

interface Props {
  event: CalendarEvent | null;
  start: number;
  onSave: (event: CalendarEvent) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function EventEditor({ event, start, onSave, onDelete, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const working = useRef(false);
  const [title, setTitle] = useState(event?.title ?? "");
  const [from, setFrom] = useState(localInput(event?.start ?? start));
  const [to, setTo] = useState(localInput(event?.end ?? start + HOUR));
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [color, setColor] = useState(event?.color ?? "sage");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  // Preserve the original instant when an unchanged field falls in a repeated DST hour.
  const fromTime = event && from === localInput(event.start) ? event.start : parseLocalInput(from);
  const toTime = event && to === localInput(event.end) ? event.end : parseLocalInput(to);

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    titleInput.current?.focus();
    return () => element.close();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (working.current) return;
    const current = Date.now();
    const next: CalendarEvent = {
      id: event?.id ?? crypto.randomUUID(), title: title.trim(), start: fromTime, end: toTime,
      notes, color, createdAt: event?.createdAt ?? current, updatedAt: current,
    };
    const validation = validateEvent(next);
    if (validation) { setError(validation); return; }
    working.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave(next);
      onClose();
    } catch (cause) {
      setError("保存未完成，填写的内容已保留。请重试。" + (cause instanceof Error ? " " + cause.message : ""));
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  async function remove() {
    if (!event || working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      await onDelete(event.id);
      onClose();
    } catch {
      setError("删除未完成，请重试。");
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} className="event-dialog" aria-labelledby="editor-title"
      onCancel={(e) => { e.preventDefault(); if (!working.current) onClose(); }}>
      <form onSubmit={submit}>
        <header className="dialog-header">
          <div><p className="eyebrow">YOUR TIME</p><h2 id="editor-title">{event ? "编辑事项" : "安排一件事"}</h2></div>
          <button type="button" className="icon-button" aria-label="关闭编辑窗口" disabled={busy} onClick={onClose}>×</button>
        </header>
        <fieldset disabled={busy} className="editor-fields">
          <label>事项名称<input ref={titleInput} autoFocus required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="想把这段时间留给什么？" /></label>
          <div className="time-fields">
            <label>开始时间<input type="datetime-local" required step={60} value={from} onInput={(e) => setFrom(e.currentTarget.value)} /></label>
            <label>结束时间<input type="datetime-local" required step={60} value={to} onInput={(e) => setTo(e.currentTarget.value)} /></label>
          </div>
          <div className="duration-row">
            <span>{Number.isFinite(toTime - fromTime) && toTime > fromTime ? durationLabel(toTime - fromTime) : "选择起止时间"}</span>
            <button type="button" className="text-button" onClick={() => { if (Number.isFinite(fromTime)) setTo(localInput(fromTime + 30 * MINUTE)); }}>30 分钟</button>
            <button type="button" className="text-button" onClick={() => { if (Number.isFinite(fromTime)) setTo(localInput(fromTime + HOUR)); }}>1 小时</button>
          </div>
          <label>备注 <span className="optional">选填</span><textarea rows={3} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="记下想做的事情…" /></label>
          <fieldset className="color-picker"><legend>颜色</legend>
            {COLORS.map((value, index) => <label key={value} className={"color-option " + value}>
              <input type="radio" name="color" value={value} checked={color === value} onChange={() => setColor(value)} />
              <span>{COLOR_NAMES[index]}</span>
            </label>)}
          </fieldset>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        {deleting ? (
          <div className="delete-confirm" role="group" aria-label="确认删除">
            <p>删除「{event?.title}」？</p>
            <button className="button" type="button" disabled={busy} onClick={() => setDeleting(false)}>保留事项</button>
            <button className="button danger" type="button" disabled={busy} onClick={remove}>{busy ? "正在删除…" : "确认删除"}</button>
          </div>
        ) : (
          <footer className="dialog-actions">
            {event && <button type="button" className="text-button danger-text" disabled={busy} onClick={() => setDeleting(true)}>删除事项</button>}
            <div className="action-spacer" />
            <button type="button" className="button" disabled={busy} onClick={onClose}>取消</button>
            <button type="submit" className="button primary" disabled={busy}>{busy ? "正在保存…" : "保存事项"}</button>
          </footer>
        )}
      </form>
    </dialog>
  );
}

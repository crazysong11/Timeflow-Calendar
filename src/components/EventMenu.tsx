import { useLayoutEffect, useRef, useState } from "react";
import type { CalendarEvent } from "../lib/time";

export interface EventMenuTarget { event: CalendarEvent; x: number; y: number; source: HTMLElement }
export default function EventMenu({ target, onClose, onEdit, onComplete }: {
  target: EventMenuTarget; onClose: () => void; onEdit: () => void; onComplete: () => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: target.x, top: target.y });
  useLayoutEffect(() => {
    const element = menu.current!;
    const rect = element.getBoundingClientRect();
    setPosition({ left: Math.max(8, Math.min(target.x, window.innerWidth - rect.width - 8)), top: Math.max(8, Math.min(target.y, window.innerHeight - rect.height - 8)) });
    element.querySelector<HTMLButtonElement>("button")?.focus();
    const outside = (e: globalThis.PointerEvent) => { if (!element.contains(e.target as Node)) onClose(); };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("resize", onClose);
    return () => { window.removeEventListener("pointerdown", outside); window.removeEventListener("resize", onClose); };
  }, [target, onClose]);
  return <div ref={menu} className="event-menu" role="menu" aria-label={target.event.title + "的操作"} style={position}
    onContextMenu={(e) => e.preventDefault()}
    onKeyDown={(e) => {
      if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); onClose(); target.source.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); const buttons = [...menu.current!.querySelectorAll<HTMLButtonElement>("button")];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (e.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length].focus();
      }
    }}>
    <button role="menuitem" onClick={onComplete}>{target.event.completed ? "恢复未完成" : "✓ 标记为完成"}</button>
    <button role="menuitem" onClick={onEdit}>编辑事项</button>
  </div>;
}

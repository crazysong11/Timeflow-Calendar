import { useEffect, useRef, type PointerEvent, type KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";

type Kind = "move" | "resize";

export default function DesktopLayout({ onError }: { onError: (message: string) => void }) {
  const gesture = useRef<{ id: number; x: number; y: number; dx: number; dy: number } | null>(null);
  const frame = useRef(0);
  const queue = useRef(Promise.resolve());

  function enqueue(action: () => Promise<void>) {
    queue.current = queue.current.then(action).catch((error: unknown) => {
      onError(typeof error === "string" ? error : "布局调整未完成，请重试。");
    });
  }

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    if (gesture.current) {
      gesture.current = null;
      void queue.current.then(() => invoke("finish_desktop_adjust")).catch(() => {});
    }
  }, []);

  function begin(event: PointerEvent<HTMLButtonElement>, kind: Kind) {
    if (event.button !== 0 || gesture.current) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id: event.pointerId, x: event.screenX, y: event.screenY, dx: 0, dy: 0 };
    enqueue(() => invoke("begin_desktop_adjust", { kind }));
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    current.dx = event.screenX - current.x;
    current.dy = event.screenY - current.y;
    if (!frame.current) frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const { dx, dy } = current;
      enqueue(() => invoke("update_desktop_adjust", { dx, dy }));
    });
  }

  function finish(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    gesture.current = null;
    const dx = event.type === "pointerup" ? event.screenX - current.x : current.dx;
    const dy = event.type === "pointerup" ? event.screenY - current.y : current.dy;
    enqueue(() => invoke("update_desktop_adjust", { dx, dy }));
    enqueue(() => invoke("finish_desktop_adjust"));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keyboard(event: KeyboardEvent<HTMLButtonElement>, kind: Kind) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 50 : 10;
    const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    enqueue(() => invoke("begin_desktop_adjust", { kind }));
    enqueue(() => invoke("update_desktop_adjust", { dx, dy }));
    enqueue(() => invoke("finish_desktop_adjust"));
  }

  return <>
    <button className="desktop-move-handle" aria-label="移动桌面日历" title="拖动移动；方向键微调，Shift 加速"
      onPointerDown={(e) => begin(e, "move")} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
      onKeyDown={(e) => keyboard(e, "move")}>⠿ 拖动这里移动日历 · 右下角调整大小</button>
    <button className="desktop-resize-handle" aria-label="调整桌面日历大小" title="拖动调整大小；方向键微调，Shift 加速"
      onPointerDown={(e) => begin(e, "resize")} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
      onKeyDown={(e) => keyboard(e, "resize")}>◢</button>
  </>;
}

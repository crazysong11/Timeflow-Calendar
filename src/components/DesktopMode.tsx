import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import DesktopLayout from "./DesktopLayout";

interface Status { enabled: boolean; message: string | null }

export default function DesktopMode({ onChange, onNotice }: {
  onChange: (enabled: boolean) => void;
  onNotice: (message: string) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let active = true;
    const apply = (status: Status) => {
      if (!active) return;
      setEnabled(status.enabled);
      if (!status.enabled) setEditing(false);
      onChange(status.enabled);
      setError(status.message ?? "");
    };
    const subscription = listen<Status>("desktop-mode-changed", (event) => apply(event.payload));
    subscription.then(() => invoke<Status>("desktop_status")).then(apply).catch(() => {
      if (active) setError("桌面模式状态读取未完成，请重新打开应用。");
    });
    return () => { active = false; void subscription.then((unlisten) => unlisten()).catch(() => {}); };
  }, [onChange]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const status = await invoke<Status>("set_desktop_mode", { enabled: !enabled });
      setEnabled(status.enabled);
      onChange(status.enabled);
      setError(status.message ?? "");
      onNotice(status.enabled ? "已贴到桌面 · 从托盘或“恢复窗口”调整位置" : "已恢复普通窗口");
    } catch (reason) {
      setError(typeof reason === "string" ? reason : "桌面模式切换未完成，请重试。");
    } finally { setBusy(false); }
  }

  return <div className="desktop-controls">
    {enabled && <button className="button" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "完成调整" : "调整布局"}</button>}
    <button className="button desktop-toggle" onClick={() => void toggle()} disabled={busy}
      aria-pressed={enabled} title={enabled ? "恢复普通窗口后可移动和调整大小" : "固定到 Windows 桌面，其他应用可正常覆盖日历"}>
      {busy ? "正在切换…" : enabled ? "恢复窗口" : "贴到桌面"}
    </button>
    {error && <span className="desktop-error" role="alert">{error}</span>}
    {enabled && editing && <DesktopLayout onError={setError} />}
  </div>;
}

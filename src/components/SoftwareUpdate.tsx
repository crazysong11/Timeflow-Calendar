import { useEffect, useRef } from "react";
import type { UpdateState } from "../lib/updates";

export default function SoftwareUpdate({ state, version, blocked, onCheck, onInstall, onClose }: {
  state: UpdateState; version: string; blocked: boolean; onCheck: () => void; onInstall: () => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const working = state.phase === "downloading" || state.phase === "installing";
  useEffect(() => { const element = dialog.current!; element.showModal(); return () => element.close(); }, []);
  const progress = state.total ? Math.min(100, Math.round(state.received / state.total * 100)) : undefined;
  return <dialog ref={dialog} className="event-dialog update-dialog" aria-labelledby="update-title"
    onCancel={(e) => { e.preventDefault(); if (!working) onClose(); }}>
    <header className="dialog-header"><div><p className="eyebrow">TIMEFLOW CALENDAR · {version}</p><h2 id="update-title">软件更新</h2></div>
      <button className="icon-button" aria-label="关闭软件更新" disabled={working} onClick={onClose}>×</button></header>
    <div className="update-content" aria-live="polite">
      {state.phase === "idle" && <p>启动后自动检查新版本，也可以随时手动检查。</p>}
      {state.phase === "checking" && <p>正在检查更新…</p>}
      {state.phase === "latest" && <p>当前已是最新版本。</p>}
      {state.version && <><h3>新版本 {state.version}</h3><pre className="update-notes">{state.notes || "此版本包含功能改进与问题修复。"}</pre></>}
      {state.phase === "downloading" && <><p>正在下载并校验更新… {progress === undefined ? `${(state.received / 1048576).toFixed(1)} MB` : `${progress}%`}</p><progress aria-label="更新下载进度" max={100} value={progress} /></>}
      {state.phase === "installing" && <p>正在启动安装程序，应用将在更新后重新打开…</p>}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {blocked && state.version && <p>请先保存或关闭正在编辑的事项，再安装更新。</p>}
      <p className="update-hint">更新会保留日程与设置，并安装到当前程序目录。安装时应用会退出，完成后自动重启。</p>
    </div>
    <footer className="dialog-actions"><button className="button" disabled={working || state.phase === "checking"} onClick={onCheck}>检查更新</button><div className="action-spacer" />
      {state.version && <button className="button primary" disabled={blocked || working || state.phase === "checking"} onClick={onInstall}>{working ? "正在更新…" : "下载并更新"}</button>}
      <button className="text-button" disabled={working} onClick={onClose}>{state.version ? "稍后" : "关闭"}</button></footer>
  </dialog>;
}

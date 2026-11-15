import { useEffect, useRef } from "react";
import { DEFAULT_APPEARANCE, type Appearance } from "../lib/appearance";

export default function AppearanceSettings({ value, error, onChange, onClose, onCheckUpdates }: {
  value: Appearance; error: string; onChange: (value: Appearance) => void; onClose: () => void; onCheckUpdates?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current!; element.showModal(); return () => element.close(); }, []);
  return <dialog ref={dialog} className="event-dialog appearance-dialog" aria-labelledby="appearance-title"
    onCancel={(e) => { e.preventDefault(); onClose(); }}>
    <header className="dialog-header"><div><p className="eyebrow">MAKE IT YOURS</p><h2 id="appearance-title">外观设置</h2></div>
      <button type="button" className="icon-button" aria-label="关闭外观设置" onClick={onClose}>×</button></header>
    <div className="appearance-fields">
      <label>主题<select value={value.theme} onChange={(e) => onChange({ ...value, theme: e.target.value as Appearance["theme"] })}>
        <option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option>
      </select></label>
      <label>界面大小<select value={value.scale} onChange={(e) => onChange({ ...value, scale: Number(e.target.value) as Appearance["scale"] })}>
        <option value={90}>紧凑 · 90%</option><option value={100}>标准 · 100%</option><option value={110}>较大 · 110%</option><option value={120}>更大 · 120%</option>
      </select></label>
      <p>在窗口自动缩放的基础上调整，文字保留最小可读字号。</p>
      <label className="appearance-check"><input type="checkbox" checked={value.desktopAgenda} onChange={(e) => onChange({ ...value, desktopAgenda: e.target.checked })} />桌面模式显示下方事项列表</label>
      <p>关闭后，桌面面板集中显示时间轴。普通窗口继续显示事项列表。</p>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {onCheckUpdates && <div className="settings-update"><span>启动时自动检查新版本</span><button className="button" onClick={onCheckUpdates}>检查更新</button></div>}
    <footer className="dialog-actions"><button className="text-button" onClick={() => onChange({ ...DEFAULT_APPEARANCE })}>恢复默认外观</button><div className="action-spacer" />
      <button className="button primary" onClick={onClose}>完成</button></footer>
  </dialog>;
}

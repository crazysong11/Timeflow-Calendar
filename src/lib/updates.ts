export type DownloadEvent =
  | { event: "Started"; data: { contentLength?: number } }
  | { event: "Progress"; data: { chunkLength: number } }
  | { event: "Finished" };

export interface UpdatePackage {
  version: string;
  body?: string;
  download: (progress: (event: DownloadEvent) => void, options: { timeout: number }) => Promise<void>;
  install: (options: { restartAfterInstall: boolean }) => Promise<void>;
  close: () => Promise<void>;
}
export interface UpdateState {
  phase: "idle" | "checking" | "latest" | "available" | "downloading" | "installing" | "error";
  version: string;
  notes: string;
  received: number;
  total?: number;
  error: string;
}

// One controller serializes startup, tray and settings requests, including retries.
export class UpdateController {
  private update: UpdatePackage | null = null;
  private listeners = new Set<() => void>();
  private state: UpdateState = { phase: "idle", version: "", notes: "", received: 0, error: "" };
  private checkUpdate: () => Promise<UpdatePackage | null>;
  constructor(checkUpdate: () => Promise<UpdatePackage | null>) { this.checkUpdate = checkUpdate; }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private set(value: Partial<UpdateState>) {
    this.state = { ...this.state, ...value };
    for (const listener of this.listeners) listener();
  }
  async check() {
    if (["checking", "downloading", "installing"].includes(this.state.phase)) return;
    this.set({ phase: "checking", error: "" });
    const previous = this.update;
    this.update = null;
    try {
      await previous?.close().catch(() => {});
      this.update = await this.checkUpdate();
      this.set({ phase: this.update ? "available" : "latest", version: this.update?.version ?? "", notes: this.update?.body ?? "", received: 0, total: undefined });
    } catch {
      this.set({ phase: "error", version: "", notes: "", error: "暂时无法检查更新，请确认网络可访问 GitHub 后重试。" });
    }
  }
  async install(canInstall: () => boolean) {
    if (!this.update || !["available", "error"].includes(this.state.phase) || !canInstall()) return;
    this.set({ phase: "downloading", error: "", received: 0, total: undefined });
    try {
      await this.update.download((event) => {
        if (event.event === "Started") this.set({ received: 0, total: event.data.contentLength });
        if (event.event === "Progress") this.set({ received: this.state.received + event.data.chunkLength });
      }, { timeout: 300_000 });
      // Download resolves only after signature verification. Check edits again before exiting.
      if (!canInstall()) {
        this.set({ phase: "available", error: "请先保存或关闭正在编辑的事项，再安装更新。" });
        return;
      }
      this.set({ phase: "installing" });
      await this.update.install({ restartAfterInstall: true });
    } catch {
      this.set({ phase: "error", error: "更新未完成。请检查网络与安装目录权限后重试，当前版本可继续使用。" });
    }
  }
}

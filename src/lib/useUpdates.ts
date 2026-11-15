import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { listen } from "@tauri-apps/api/event";
import { check } from "@tauri-apps/plugin-updater";
import { UpdateController } from "./updates";

export function useUpdates() {
  const [controller] = useState(() => new UpdateController(() => check({ timeout: 15_000 })));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState("");
  const manualCheck = useCallback(() => { setOpen(true); void controller.check(); }, [controller]);
  useEffect(() => {
    if (!isTauri()) return;
    let active = true;
    void getVersion().then(value => { if (active) setVersion(value); }).catch(() => {});
    const timer = window.setTimeout(() => void controller.check(), 3000);
    const online = () => { if (["idle", "error"].includes(controller.getSnapshot().phase)) void controller.check(); };
    window.addEventListener("online", online);
    const unlisten = listen("check-for-updates", manualCheck);
    return () => {
      active = false; window.clearTimeout(timer); window.removeEventListener("online", online);
      void unlisten.then(stop => stop()).catch(() => {});
    };
  }, [controller, manualCheck]);
  return { state, controller, open, setOpen, version, manualCheck };
}

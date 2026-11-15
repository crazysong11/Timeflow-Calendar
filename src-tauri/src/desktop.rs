use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Emitter, Manager, WebviewWindow};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Bounds {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

#[derive(Default, Serialize, Deserialize)]
struct Preferences {
    enabled: bool,
    bounds: Option<Bounds>,
}

#[derive(Clone, Serialize)]
pub struct DesktopStatus {
    enabled: bool,
    message: Option<String>,
}

#[derive(Default)]
pub struct DesktopState(Mutex<Session>);

#[derive(Default)]
struct Session {
    normal: Option<NativeSnapshot>,
    message: Option<String>,
    adjustment: Option<Adjustment>,
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AdjustKind {
    Move,
    Resize,
}

struct Adjustment {
    kind: AdjustKind,
    bounds: Bounds,
    scale: f64,
}

impl Adjustment {
    fn apply(&self, dx: f64, dy: f64) -> Bounds {
        let mut bounds = self.bounds;
        let delta_x = (dx * self.scale).round() as i32;
        let delta_y = (dy * self.scale).round() as i32;
        match self.kind {
            AdjustKind::Move => {
                bounds.x = bounds.x.saturating_add(delta_x);
                bounds.y = bounds.y.saturating_add(delta_y);
            }
            AdjustKind::Resize => {
                bounds.width = bounds
                    .width
                    .saturating_add(delta_x)
                    .max((640.0 * self.scale) as i32);
                bounds.height = bounds
                    .height
                    .saturating_add(delta_y)
                    .max((480.0 * self.scale) as i32);
            }
        }
        bounds
    }
}

#[tauri::command]
pub fn begin_desktop_adjust(window: WebviewWindow, kind: AdjustKind) -> Result<(), String> {
    let state = window.state::<DesktopState>();
    let mut session = state.0.lock().map_err(|e| e.to_string())?;
    let bounds = session
        .normal
        .as_ref()
        .ok_or("请先切换到桌面模式。")?
        .bounds;
    session.adjustment = Some(Adjustment {
        kind,
        bounds,
        scale: window.scale_factor().map_err(|e| e.to_string())?,
    });
    Ok(())
}

#[tauri::command]
pub fn update_desktop_adjust(window: WebviewWindow, dx: f64, dy: f64) -> Result<(), String> {
    if !dx.is_finite() || !dy.is_finite() || dx.abs() > 100_000.0 || dy.abs() > 100_000.0 {
        return Err("请使用有效的调整距离。".into());
    }
    let state = window.state::<DesktopState>();
    let mut session = state.0.lock().map_err(|e| e.to_string())?;
    let gesture = session.adjustment.as_ref().ok_or("请先开启布局调整。")?;
    let bounds = gesture.apply(dx, dy);
    let actual = native::reposition(&window, bounds)?;
    if let Some(snapshot) = session.normal.as_mut() {
        snapshot.bounds = actual;
    }
    Ok(())
}

#[tauri::command]
pub fn finish_desktop_adjust(window: WebviewWindow) -> Result<(), String> {
    let state = window.state::<DesktopState>();
    let mut session = state.0.lock().map_err(|e| e.to_string())?;
    session.adjustment = None;
    save_preferences(
        window.app_handle(),
        &Preferences {
            enabled: session.normal.is_some(),
            bounds: session.normal.as_ref().map(|s| s.bounds),
        },
    )
    .map_err(|_| "位置已调整；偏好保存未完成，请再次调整后重试。".into())
}

struct NativeSnapshot {
    style: isize,
    ex_style: isize,
    bounds: Bounds,
}

#[tauri::command]
pub fn desktop_status(state: tauri::State<'_, DesktopState>) -> DesktopStatus {
    let session = state.0.lock().unwrap_or_else(|e| e.into_inner());
    DesktopStatus {
        enabled: session.normal.is_some(),
        message: session.message.clone(),
    }
}

fn preferences_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|dir| dir.join("desktop.json"))
        .map_err(|e| e.to_string())
}

fn save_preferences(app: &tauri::AppHandle, prefs: &Preferences) -> Result<(), String> {
    let path = preferences_path(app)?;
    std::fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    let temp = path.with_extension("json.tmp");
    std::fs::write(&temp, serde_json::to_vec(prefs).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    std::fs::rename(temp, path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_desktop_mode(window: WebviewWindow, enabled: bool) -> Result<DesktopStatus, String> {
    change_mode(&window, enabled, None)
}

fn change_mode(
    window: &WebviewWindow,
    enabled: bool,
    initial_bounds: Option<Bounds>,
) -> Result<DesktopStatus, String> {
    let state = window.state::<DesktopState>();
    let mut session = state.0.lock().map_err(|e| e.to_string())?;
    if enabled != session.normal.is_some() {
        if enabled {
            session.normal = Some(native::attach(window, initial_bounds)?);
        } else if let Some(snapshot) = session.normal.as_ref() {
            native::detach(window, snapshot)?;
            session.normal = None;
            session.adjustment = None;
        }
    }
    let prefs = Preferences {
        enabled: session.normal.is_some(),
        bounds: session.normal.as_ref().map(|s| s.bounds),
    };
    session.message = save_preferences(window.app_handle(), &prefs)
        .err()
        .map(|_| "桌面模式已切换；偏好保存未完成，下次启动可重新选择。".to_string());
    let status = DesktopStatus {
        enabled: prefs.enabled,
        message: session.message.clone(),
    };
    drop(session);
    let _ = window.emit("desktop-mode-changed", &status);
    Ok(status)
}

pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::TrayIconBuilder;

    let restore = MenuItem::with_id(
        app,
        "restore",
        "打开普通窗口 / 调整位置",
        true,
        None::<&str>,
    )?;
    let pin = MenuItem::with_id(app, "pin", "贴到桌面", true, None::<&str>)?;
    let exit = MenuItem::with_id(app, "exit", "退出 Timeflow Calendar", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&restore, &pin, &exit])?;
    let mut tray = TrayIconBuilder::with_id("timeflow")
        .tooltip("Timeflow Calendar")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| {
            if event.id.as_ref() == "exit" {
                app.exit(0);
                return;
            }
            if let Some(window) = app.get_webview_window("main") {
                let result = change_mode(&window, event.id.as_ref() == "pin", None);
                if let Err(error) = result {
                    let state = app.state::<DesktopState>();
                    let mut session = state.0.lock().unwrap_or_else(|e| e.into_inner());
                    session.message = Some(error.clone());
                    let status = DesktopStatus {
                        enabled: session.normal.is_some(),
                        message: Some(error),
                    };
                    drop(session);
                    let _ = window.emit("desktop-mode-changed", status);
                }
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;

    let prefs = preferences_path(app.handle())
        .ok()
        .and_then(|path| std::fs::read(path).ok())
        .and_then(|bytes| serde_json::from_slice::<Preferences>(&bytes).ok())
        .unwrap_or_default();
    if prefs.enabled {
        if let Some(window) = app.get_webview_window("main") {
            if let Err(error) = change_mode(&window, true, prefs.bounds) {
                app.state::<DesktopState>()
                    .0
                    .lock()
                    .unwrap_or_else(|e| e.into_inner())
                    .message = Some(error);
            }
        }
    }
    Ok(())
}

#[cfg(windows)]
mod native {
    use super::{fit_in_work_area, Bounds, NativeSnapshot};
    use std::ptr::null_mut;
    use tauri::WebviewWindow;
    use windows_sys::Win32::{
        Foundation::{GetLastError, SetLastError, HWND, LPARAM, POINT, RECT},
        Graphics::Gdi::{
            GetMonitorInfoW, MonitorFromRect, ScreenToClient, MONITORINFO, MONITOR_DEFAULTTONEAREST,
        },
        UI::WindowsAndMessaging::*,
    };

    unsafe extern "system" fn find_desktop(hwnd: HWND, output: LPARAM) -> i32 {
        let mut class = [0u16; 64];
        let length = GetClassNameW(hwnd, class.as_mut_ptr(), class.len() as i32);
        let class = String::from_utf16_lossy(&class[..length.max(0) as usize]);
        if class != "Progman" && class != "WorkerW" {
            return 1;
        }
        let icons = FindWindowExW(
            hwnd,
            null_mut(),
            windows_sys::core::w!("SHELLDLL_DefView"),
            std::ptr::null(),
        );
        if !icons.is_null() {
            *(output as *mut HWND) = hwnd;
            return 0;
        }
        1
    }

    fn error(action: &str) -> String {
        format!("{action}未完成：{}", std::io::Error::last_os_error())
    }

    unsafe fn set_style(hwnd: HWND, index: i32, value: isize) -> Result<(), String> {
        SetLastError(0);
        let previous = SetWindowLongPtrW(hwnd, index, value);
        if previous == 0 && GetLastError() != 0 {
            return Err(error("窗口样式调整"));
        }
        Ok(())
    }

    unsafe fn set_parent(hwnd: HWND, parent: HWND) -> Result<(), String> {
        SetLastError(0);
        let previous = SetParent(hwnd, parent);
        if previous.is_null() && GetLastError() != 0 {
            return Err(error("桌面连接"));
        }
        Ok(())
    }

    // Saved positions remain inside the nearest monitor's work area after a display change.
    unsafe fn fit_bounds(bounds: Bounds) -> Bounds {
        let rect = RECT {
            left: bounds.x,
            top: bounds.y,
            right: bounds.x.saturating_add(bounds.width),
            bottom: bounds.y.saturating_add(bounds.height),
        };
        let monitor = MonitorFromRect(&rect, MONITOR_DEFAULTTONEAREST);
        let mut info: MONITORINFO = std::mem::zeroed();
        info.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
        if GetMonitorInfoW(monitor, &mut info) == 0 {
            return bounds;
        }
        let work = info.rcWork;
        fit_in_work_area(
            bounds,
            Bounds {
                x: work.left,
                y: work.top,
                width: work.right - work.left,
                height: work.bottom - work.top,
            },
        )
    }

    pub fn attach(
        window: &WebviewWindow,
        initial: Option<Bounds>,
    ) -> Result<NativeSnapshot, String> {
        let hwnd = window.hwnd().map_err(|e| e.to_string())?.0 as HWND;
        unsafe {
            let mut host: HWND = null_mut();
            EnumWindows(Some(find_desktop), &mut host as *mut HWND as LPARAM);
            if host.is_null() {
                return Err("正在等待 Windows 桌面就绪，请稍后再次选择“贴到桌面”。".into());
            }
            ShowWindow(hwnd, SW_RESTORE);
            let mut rect: RECT = std::mem::zeroed();
            if GetWindowRect(hwnd, &mut rect) == 0 {
                return Err(error("读取窗口位置"));
            }
            let bounds = fit_bounds(initial.unwrap_or(Bounds {
                x: rect.left,
                y: rect.top,
                width: rect.right - rect.left,
                height: rect.bottom - rect.top,
            }));
            let snapshot = NativeSnapshot {
                style: GetWindowLongPtrW(hwnd, GWL_STYLE),
                ex_style: GetWindowLongPtrW(hwnd, GWL_EXSTYLE),
                bounds,
            };
            let style = (snapshot.style as u32
                & !(WS_POPUP
                    | WS_CAPTION
                    | WS_THICKFRAME
                    | WS_SYSMENU
                    | WS_MINIMIZEBOX
                    | WS_MAXIMIZEBOX))
                | WS_CHILD;
            let result = (|| {
                set_style(hwnd, GWL_STYLE, style as isize)?;
                set_style(
                    hwnd,
                    GWL_EXSTYLE,
                    ((snapshot.ex_style as u32 & !WS_EX_APPWINDOW) | WS_EX_TOOLWINDOW) as isize,
                )?;
                set_parent(hwnd, host)?;
                let mut point = POINT {
                    x: bounds.x,
                    y: bounds.y,
                };
                if ScreenToClient(host, &mut point) == 0 {
                    return Err(error("转换桌面位置"));
                }
                if SetWindowPos(
                    hwnd,
                    HWND_TOP,
                    point.x,
                    point.y,
                    bounds.width,
                    bounds.height,
                    SWP_FRAMECHANGED | SWP_SHOWWINDOW | SWP_NOACTIVATE,
                ) == 0
                {
                    return Err(error("设置桌面位置"));
                }
                Ok(())
            })();
            if let Err(error) = result {
                let _ = detach(window, &snapshot);
                return Err(error);
            }
            Ok(snapshot)
        }
    }

    pub fn detach(window: &WebviewWindow, snapshot: &NativeSnapshot) -> Result<(), String> {
        let hwnd = window.hwnd().map_err(|e| e.to_string())?.0 as HWND;
        unsafe {
            set_parent(hwnd, null_mut())?;
            set_style(hwnd, GWL_STYLE, snapshot.style)?;
            set_style(hwnd, GWL_EXSTYLE, snapshot.ex_style)?;
            let bounds = fit_bounds(snapshot.bounds);
            if SetWindowPos(
                hwnd,
                HWND_TOP,
                bounds.x,
                bounds.y,
                bounds.width,
                bounds.height,
                SWP_FRAMECHANGED | SWP_SHOWWINDOW,
            ) == 0
            {
                return Err(error("恢复窗口"));
            }
            ShowWindow(hwnd, SW_RESTORE);
        }
        window.set_focus().map_err(|e| e.to_string())
    }

    pub fn reposition(window: &WebviewWindow, bounds: Bounds) -> Result<Bounds, String> {
        let hwnd = window.hwnd().map_err(|e| e.to_string())?.0 as HWND;
        unsafe {
            let parent = GetParent(hwnd);
            if parent.is_null() {
                return Err("请重新选择“贴到桌面”后调整布局。".into());
            }
            let bounds = fit_bounds(bounds);
            let mut point = POINT {
                x: bounds.x,
                y: bounds.y,
            };
            if ScreenToClient(parent, &mut point) == 0 {
                return Err(error("转换桌面位置"));
            }
            if SetWindowPos(
                hwnd,
                HWND_TOP,
                point.x,
                point.y,
                bounds.width,
                bounds.height,
                SWP_NOACTIVATE,
            ) == 0
            {
                return Err(error("调整桌面布局"));
            }
            Ok(bounds)
        }
    }
}

#[cfg(not(windows))]
mod native {
    use super::{Bounds, NativeSnapshot};
    use tauri::WebviewWindow;
    pub fn attach(_: &WebviewWindow, _: Option<Bounds>) -> Result<NativeSnapshot, String> {
        Err("桌面模式适用于 Windows。".into())
    }
    pub fn detach(_: &WebviewWindow, _: &NativeSnapshot) -> Result<(), String> {
        Ok(())
    }
    pub fn reposition(_: &WebviewWindow, _: Bounds) -> Result<Bounds, String> {
        Err("桌面模式适用于 Windows。".into())
    }
}

fn fit_in_work_area(bounds: Bounds, work: Bounds) -> Bounds {
    let width = bounds.width.max(640).min(work.width);
    let height = bounds.height.max(480).min(work.height);
    Bounds {
        x: bounds.x.clamp(work.x, work.x + work.width - width),
        y: bounds.y.clamp(work.y, work.y + work.height - height),
        width,
        height,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn movement_uses_dpi_scale_and_preserves_size() {
        let adjustment = Adjustment {
            kind: AdjustKind::Move,
            bounds: Bounds {
                x: -1600,
                y: 100,
                width: 1200,
                height: 900,
            },
            scale: 1.5,
        };
        assert_eq!(
            adjustment.apply(100.0, -50.0),
            Bounds {
                x: -1450,
                y: 25,
                width: 1200,
                height: 900
            }
        );
    }

    #[test]
    fn resizing_keeps_minimum_logical_dimensions() {
        let adjustment = Adjustment {
            kind: AdjustKind::Resize,
            bounds: Bounds {
                x: 200,
                y: 100,
                width: 1200,
                height: 900,
            },
            scale: 1.5,
        };
        assert_eq!(
            adjustment.apply(100.0, -1000.0),
            Bounds {
                x: 200,
                y: 100,
                width: 1350,
                height: 720
            }
        );
        assert_eq!(
            adjustment.apply(-1000.0, -1000.0),
            Bounds {
                x: 200,
                y: 100,
                width: 960,
                height: 720
            }
        );
    }

    #[test]
    fn saved_layout_fits_negative_monitor_coordinates_and_work_area() {
        let work = Bounds {
            x: -1920,
            y: 0,
            width: 1920,
            height: 1080,
        };
        assert_eq!(
            fit_in_work_area(
                Bounds {
                    x: -3000,
                    y: 1200,
                    width: 800,
                    height: 480
                },
                work
            ),
            Bounds {
                x: -1920,
                y: 600,
                width: 800,
                height: 480
            }
        );
        assert_eq!(
            fit_in_work_area(
                Bounds {
                    x: 2000,
                    y: -500,
                    width: 5000,
                    height: 2000
                },
                work
            ),
            work
        );
    }
}

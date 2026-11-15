use tauri_plugin_sql::{Migration, MigrationKind};
mod desktop;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(desktop::DesktopState::default())
        .invoke_handler(tauri::generate_handler![
            desktop::desktop_status,
            desktop::set_desktop_mode,
            desktop::begin_desktop_adjust,
            desktop::update_desktop_adjust,
            desktop::finish_desktop_adjust
        ])
        .setup(desktop::setup)
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:timeflow.db",
                    vec![Migration {
                        version: 1,
                        description: "create_events",
                        sql: include_str!("../migrations/001_events.sql"),
                        kind: MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("Unable to start Timeflow Calendar");
}

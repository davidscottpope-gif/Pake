#[cfg(not(target_os = "macos"))]
compile_error!("This Pake fork supports macOS only.");

mod app;
mod util;

use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{webview::PageLoadEvent, Manager, Url, WebviewWindow};
use tauri_plugin_window_state::Builder as WindowStatePlugin;
use tauri_plugin_window_state::StateFlags;

use std::time::Duration;

// Fallback when PageLoadEvent::Finished never arrives (offline / stalled).
// Deliberately longer than a paint tick so the normal path can win first.
const STARTUP_WINDOW_FALLBACK_DELAY: u64 = 3_000;
use app::{
    invoke::{
        clear_dock_badge, close_notification, download_file, increment_dock_badge,
        send_notification, set_dock_badge, set_dock_badge_label, set_title_bar_color, set_zoom,
        update_theme_mode, webview_navigate,
    },
    setup::{set_global_shortcut, set_system_tray},
    window::{
        open_additional_window_safe, reveal_built_window, save_last_url, set_window,
        MultiWindowState,
    },
};
use util::get_pake_config;

/// Placeholder documents used before the real target URL navigates (e.g. macOS
/// cert-bypass starts on about:blank). Revealing on these would reintroduce the
/// blank-window flash the page-load gate is meant to prevent.
fn is_placeholder_startup_url(url: &Url) -> bool {
    url.scheme().eq_ignore_ascii_case("about")
}

/// First automatic reveal wins. Returns true if the caller should show the window.
fn claim_startup_reveal(revealed: &AtomicBool) -> bool {
    !revealed.swap(true, Ordering::AcqRel)
}

/// User took control of main-window visibility (tray, shortcut, dock, second
/// instance, hide-on-close). Drop any pending page-load / fallback reveal so a
/// slow cold start cannot re-open a window the user just hid.
pub(crate) fn cancel_startup_reveal(revealed: &AtomicBool) {
    revealed.store(true, Ordering::Release);
}

fn reveal_startup_window(window: WebviewWindow, init_fullscreen: bool, revealed: &Arc<AtomicBool>) {
    if !claim_startup_reveal(revealed) {
        return;
    }

    tauri::async_runtime::spawn(async move {
        let _ = window.show();

        let _ = init_fullscreen;
    });
}

pub fn run_app() {
    let (pake_config, tauri_config, runtime_app) = get_pake_config();
    let mut context = tauri::generate_context!();
    // Paths, app data and the macOS menu derive from the context, so a runtime
    // app must not share the template's identity.
    if let Some(app) = runtime_app {
        context.config_mut().identifier = app.identifier;
        context.config_mut().product_name = Some(app.product_name.clone());
        context.package_info_mut().name = app.product_name;
    }
    let tauri_app = tauri::Builder::default();

    let show_system_tray = pake_config.show_system_tray();
    let hide_on_close = pake_config.windows[0].hide_on_close;
    let remember_url = pake_config.windows[0].remembers_last_url();
    let activation_shortcut = pake_config.windows[0].activation_shortcut.clone();
    let init_fullscreen = pake_config.windows[0].fullscreen;
    let start_to_tray = pake_config.windows[0].start_to_tray && show_system_tray; // Only valid when tray is enabled
    let multi_instance = pake_config.multi_instance;
    let multi_window = pake_config.multi_window;
    let _enable_find = pake_config.windows[0].enable_find;
    let startup_window_revealed = Arc::new(AtomicBool::new(false));

    let window_state_plugin = WindowStatePlugin::default()
        .with_state_flags(if init_fullscreen {
            StateFlags::FULLSCREEN
        } else {
            // Prevent flickering on the first open.
            // Exclude FULLSCREEN so a prior --fullscreen build's persisted state
            // doesn't force fullscreen on a rebuild without --fullscreen.
            StateFlags::all() & !StateFlags::VISIBLE & !StateFlags::FULLSCREEN
        })
        .build();

    #[allow(deprecated)]
    let mut app_builder = tauri_app
        .plugin(window_state_plugin)
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init()); // Add this

    // Only add single instance plugin if multiple instances are not allowed
    if !multi_instance {
        let instance_revealed = startup_window_revealed.clone();
        app_builder = app_builder.plugin(tauri_plugin_single_instance::init(
            move |app, _args, _cwd| {
                if multi_window {
                    open_additional_window_safe(app);
                } else if let Some(window) = app.get_webview_window("pake") {
                    cancel_startup_reveal(&instance_revealed);
                    let _ = window.unminimize();
                    let _ = window.show();

                    let _ = window.set_focus();
                }
            },
        ));
    }

    // Reveal hidden windows after the first real document finishes loading so
    // slow WKWebView cold starts do not expose an empty but interactive shell.
    // - Main label "pake": once-only latch + start_to_tray opt-out.
    // - Secondary multi-window labels ("pake-N"): reveal if still hidden (Cmd+N).
    // start_to_tray keeps the main window hidden until the user opens it.
    {
        let page_load_revealed = startup_window_revealed.clone();
        app_builder = app_builder.on_page_load(move |webview, payload| {
            if !matches!(payload.event(), PageLoadEvent::Finished) {
                return;
            }
            // Skip about:blank (and other about: placeholders) used by the macOS
            // cert-bypass path before the real target URL navigates.
            if is_placeholder_startup_url(payload.url()) {
                return;
            }

            let label = webview.label();
            if label == "pake" {
                if start_to_tray {
                    return;
                }
                if let Some(window) = webview.app_handle().get_webview_window("pake") {
                    reveal_startup_window(window, init_fullscreen, &page_load_revealed);
                }
                return;
            }

            // Multi-window clones (pake-1, pake-2, …) built hidden by
            // open_additional_window_safe.
            if label.starts_with("pake-") {
                if let Some(window) = webview.app_handle().get_webview_window(label) {
                    reveal_built_window(&window);
                }
            }
        });
    }

    // Clone before setup moves the Arc into tray / shortcut / fallback handlers.
    let close_revealed = startup_window_revealed.clone();

    let reopen_revealed = startup_window_revealed.clone();

    app_builder
        .invoke_handler(tauri::generate_handler![
            download_file,
            send_notification,
            close_notification,
            increment_dock_badge,
            set_dock_badge,
            set_dock_badge_label,
            clear_dock_badge,
            update_theme_mode,
            set_zoom,
            webview_navigate,
            set_title_bar_color,
        ])
        .setup(move |app| {
            // Grant remote IPC only to the immutable, packaged entry origins,
            // before any webview can start loading untrusted content.
            if let Some(capability) = pake_config.remote_capability()? {
                app.add_capability(capability)?;
            }
            app.manage(MultiWindowState::new(
                pake_config.clone(),
                tauri_config.clone(),
            ));

            // Main thread: installs the native notification-click delegate so a
            // click can be routed back to the page that raised the notification.
            app::notification::init_native_click(app.app_handle());

            // --- Menu Construction Start ---

            {
                app::menu::set_app_menu(app.app_handle(), multi_window, _enable_find)?;

                // Event Handling for Custom Menu Item
                app.on_menu_event(move |app_handle, event| {
                    app::menu::handle_menu_click(app_handle, event.id().as_ref());
                });
            }
            // --- Menu Construction End ---

            let window = set_window(app.app_handle(), &pake_config, &tauri_config)?;

            set_system_tray(
                app.app_handle(),
                show_system_tray,
                &pake_config.system_tray_path,
                init_fullscreen,
                multi_window,
                startup_window_revealed.clone(),
            )?;
            set_global_shortcut(
                app.app_handle(),
                activation_shortcut,
                init_fullscreen,
                startup_window_revealed.clone(),
            )?;

            // Show window after state restoration to prevent position flashing
            // once its first page finishes. A fallback keeps offline or stalled
            // pages reachable without exposing a blank webview during normal startup.
            if !start_to_tray {
                let window_clone = window.clone();
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_millis(
                        STARTUP_WINDOW_FALLBACK_DELAY,
                    ))
                    .await;
                    reveal_startup_window(window_clone, init_fullscreen, &startup_window_revealed);
                });
            } else {
                // Tray/shortcut already hold clones that cancel user-driven toggles.
                drop(startup_window_revealed);
            }

            Ok(())
        })
        .on_window_event(move |_window, _event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = _event {
                if remember_url && _window.label() == "pake" {
                    save_last_url(_window.app_handle());
                }
                if hide_on_close && _window.label() == "pake" {
                    // User dismissed the window; do not let startup reveal reopen it.
                    cancel_startup_reveal(&close_revealed);
                    // Hide window when hide_on_close is enabled (regardless of tray status)
                    let window = _window.clone();
                    tauri::async_runtime::spawn(async move {
                        {
                            if window.is_fullscreen().unwrap_or(false) {
                                let _ = window.set_fullscreen(false);
                                tokio::time::sleep(Duration::from_millis(900)).await;
                            }
                        }
                        // On macOS, directly hide without minimize to avoid duplicate Dock icons
                        let _ = window.hide();
                    });
                    api.prevent_close();
                }
                // If hide_on_close is false, allow normal close behavior
                // This lets tauri-plugin-window-state save the window position and size
            }
        })
        .build(context)
        .unwrap_or_else(|error| {
            eprintln!("[Pake] Fatal error while building Tauri application: {error}");
            std::process::exit(1);
        })
        .run(move |_app, _event| {
            if remember_url && matches!(&_event, tauri::RunEvent::Exit) {
                save_last_url(_app);
            }
            // Handle macOS dock icon click to reopen hidden window

            if let tauri::RunEvent::Reopen {
                has_visible_windows,
                ..
            } = _event
            {
                if !has_visible_windows {
                    if let Some(window) = _app.get_webview_window("pake") {
                        cancel_startup_reveal(&reopen_revealed);
                        let _ = window.show();

                        let _ = window.set_focus();
                    }
                }
            }
        });
}

pub fn run() {
    run_app()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn placeholder_startup_urls_cover_about_blank() {
        let blank: Url = "about:blank".parse().unwrap();
        let srcdoc: Url = "about:srcdoc".parse().unwrap();
        let https: Url = "https://github.com/".parse().unwrap();
        let tauri: Url = "tauri://localhost/".parse().unwrap();

        assert!(is_placeholder_startup_url(&blank));
        assert!(is_placeholder_startup_url(&srcdoc));
        assert!(!is_placeholder_startup_url(&https));
        assert!(!is_placeholder_startup_url(&tauri));
    }

    #[test]
    fn first_claim_wins_startup_reveal() {
        let revealed = AtomicBool::new(false);
        assert!(claim_startup_reveal(&revealed));
        assert!(!claim_startup_reveal(&revealed));
    }

    #[test]
    fn user_show_then_hide_blocks_automatic_startup_reveal() {
        // Slow page load: user opens from tray/shortcut, then hides again.
        // Page-load finish and the 3s fallback must not reopen the window.
        let revealed = AtomicBool::new(false);
        cancel_startup_reveal(&revealed); // explicit show
        cancel_startup_reveal(&revealed); // explicit hide
        assert!(
            !claim_startup_reveal(&revealed),
            "automatic reveal must stay cancelled after user visibility control"
        );
    }

    #[test]
    fn cancel_before_any_claim_blocks_reveal() {
        let revealed = AtomicBool::new(false);
        cancel_startup_reveal(&revealed);
        assert!(!claim_startup_reveal(&revealed));
    }
}

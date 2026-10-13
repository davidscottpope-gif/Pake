use crate::app::config::PakeConfig;
use crate::util::{
    check_file_or_append, data_dir_name, get_data_dir, get_download_dir,
    get_download_message_with_lang, sanitize_download_filename, show_toast, MessageType,
};

use dispatch::Queue;

use objc2::MainThreadMarker;

use objc2_web_kit::WKUserContentController;
use std::{
    path::PathBuf,
    str::FromStr,
    sync::atomic::{AtomicU32, Ordering},
};
use tauri::{
    webview::{DownloadEvent, NewWindowFeatures, NewWindowResponse},
    AppHandle, Config, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

use tauri::Theme;

use tauri::TitleBarStyle;

fn prepare_macos_new_window_configuration(features: &NewWindowFeatures) -> tauri::Result<()> {
    let mtm = MainThreadMarker::new().ok_or_else(|| {
        std::io::Error::other("macOS new-window configuration must run on the main thread")
    })?;
    // WebKit requires the exact target configuration it supplied to be used
    // for the new page. Replace only the inherited content controller so Wry
    // can register Pake's IPC handler and scripts once on the new webview.
    let controller = unsafe { WKUserContentController::new(mtm) };
    unsafe {
        features
            .opener()
            .target_configuration
            .setUserContentController(&controller);
    }
    Ok(())
}

pub struct MultiWindowState {
    pub pake_config: PakeConfig,
    pub tauri_config: Config,
    next_window_index: AtomicU32,
}

impl MultiWindowState {
    pub fn new(pake_config: PakeConfig, tauri_config: Config) -> Self {
        Self {
            pake_config,
            tauri_config,
            next_window_index: AtomicU32::new(0),
        }
    }

    fn next_window_label(&self) -> String {
        let index = self.next_window_index.fetch_add(1, Ordering::Relaxed) + 1;
        format!("{SECONDARY_WINDOW_LABEL_PREFIX}{index}")
    }
}

/// Secondary windows (Cmd+N clones, `--new-window` popups, blank two-stage
/// popups) take `pake-N` labels. `capabilities/default.json` must cover them
/// with a matching glob: an uncovered label has every IPC call denied, so
/// external links, downloads and toasts silently stop working there.
const SECONDARY_WINDOW_LABEL_PREFIX: &str = "pake-";

#[cfg(test)]
mod capability_tests {
    use super::SECONDARY_WINDOW_LABEL_PREFIX;

    #[test]
    fn the_capability_covers_secondary_window_labels() {
        let capability: serde_json::Value =
            serde_json::from_str(include_str!("../../capabilities/default.json"))
                .expect("capabilities/default.json should be valid JSON");
        let webviews: Vec<&str> = capability["webviews"]
            .as_array()
            .expect("the capability should list its webviews")
            .iter()
            .filter_map(|entry| entry.as_str())
            .collect();

        assert!(webviews.contains(&"pake"));
        assert!(webviews.contains(&format!("{SECONDARY_WINDOW_LABEL_PREFIX}*").as_str()));
    }
}

pub fn set_window(
    app: &AppHandle,
    config: &PakeConfig,
    tauri_config: &Config,
) -> tauri::Result<WebviewWindow> {
    build_window_with_label(app, config, tauri_config, "pake")
}

pub fn open_additional_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let state = app.state::<MultiWindowState>();
    let label = state.next_window_label();
    build_window_with_label(app, &state.pake_config, &state.tauri_config, &label)
}

struct WindowBuildOptions<'a> {
    label: &'a str,
    url: WebviewUrl,
    visible: bool,
    new_window_features: Option<NewWindowFeatures>,
}

fn is_blank_popup_url(url: &Url) -> bool {
    url.scheme() == "about" && url.path() == "blank"
}

#[cfg(test)]
mod popup_tests {
    use super::is_blank_popup_url;
    use tauri::Url;

    #[test]
    fn only_blank_documents_get_the_default_popup_exception() {
        for input in ["about:blank", "about:blank#download", "about:blank?pending"] {
            assert!(is_blank_popup_url(&Url::parse(input).unwrap()));
        }
        for input in [
            "https://example.com/",
            "about:srcdoc",
            "about:blankness",
            "file:///tmp/file",
        ] {
            assert!(!is_blank_popup_url(&Url::parse(input).unwrap()));
        }
    }
}

fn open_requested_window(
    app: &AppHandle,
    config: &PakeConfig,
    tauri_config: &Config,
    target_url: Url,
    features: NewWindowFeatures,
) -> tauri::Result<WebviewWindow> {
    let state = app.state::<MultiWindowState>();
    let label = state.next_window_label();
    let window = build_window(
        app,
        config,
        tauri_config,
        WindowBuildOptions {
            label: &label,
            url: WebviewUrl::External(target_url.clone()),
            visible: true,
            new_window_features: Some(features),
        },
    )?;

    let title = target_url.host_str().unwrap_or(target_url.as_str());
    let _ = window.set_title(title);

    let _ = window.set_focus();

    Ok(window)
}

/// Open a multi-window clone of the home app. The window is built hidden and
/// revealed on its first real page load (see `lib.rs` on_page_load) so Cmd+N
/// does not flash an empty shell the way the main window used to.
pub fn open_additional_window_safe(app: &AppHandle) {
    {
        if let Ok(window) = open_additional_window(app) {
            let fallback = window.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_millis(3_000)).await;
                reveal_built_window(&fallback);
            });
        }
    }
}

/// Show a window that was built hidden once content is ready (or the fallback
/// timer fires). No-ops when already visible so page-load and fallback can race.
pub fn reveal_built_window(window: &WebviewWindow) {
    if window.is_visible().unwrap_or(true) {
        return;
    }
    let _ = window.show();

    let _ = window.set_focus();
}

/// True when any Pake webview window is currently on screen.
///
/// A minimized window does not count as visible.
pub fn any_app_window_visible(app: &AppHandle) -> bool {
    app.webview_windows().values().any(|window| {
        window.is_visible().unwrap_or(false) && !window.is_minimized().unwrap_or(false)
    })
}

/// Hide every webview window (main + multi-window clones). Used by tray Hide
/// and the activation shortcut so secondary windows are not left on screen.
pub fn hide_all_app_windows(app: &AppHandle) {
    for window in app.webview_windows().values() {
        let _ = window.hide();
    }
}

/// Show every webview window and focus the main window.
pub fn show_all_app_windows(app: &AppHandle, init_fullscreen: bool) {
    let windows = app.webview_windows();
    for window in windows.values() {
        let _ = window.unminimize();
        let _ = window.show();
    }

    let _ = init_fullscreen;

    if let Some(main) = windows.get("pake") {
        let _ = main.set_focus();
    } else if let Some(any) = windows.values().next() {
        let _ = any.set_focus();
    }
}

/// Tray-click / activation-shortcut toggle: hide all if anything is visible,
/// otherwise show all. Cancels startup reveal when the caller has already done
/// so; this helper only touches visibility.
pub fn toggle_all_app_windows(app: &AppHandle, init_fullscreen: bool) {
    if any_app_window_visible(app) {
        hide_all_app_windows(app);
    } else {
        show_all_app_windows(app, init_fullscreen);
    }
}

fn build_window_with_label(
    app: &AppHandle,
    config: &PakeConfig,
    tauri_config: &Config,
    label: &str,
) -> tauri::Result<WebviewWindow> {
    let window_config = config.windows.first().ok_or_else(|| {
        tauri::Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            "pake.json must define at least one window configuration",
        ))
    })?;
    let url = match window_config.url_type.as_str() {
        "web" => {
            let parsed = window_config.url.parse().map_err(|err| {
                tauri::Error::Io(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    format!(
                        "Invalid 'web' url '{}' in pake.json: {err}",
                        window_config.url
                    ),
                ))
            })?;
            WebviewUrl::App(parsed)
        }
        "local" => WebviewUrl::App(PathBuf::from(&window_config.url)),
        other => {
            return Err(tauri::Error::Io(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                format!("url_type must be 'web' or 'local', got '{other}'"),
            )));
        }
    };

    build_window(
        app,
        config,
        tauri_config,
        WindowBuildOptions {
            label,
            url,
            visible: false,
            new_window_features: None,
        },
    )
}

fn build_window(
    app: &AppHandle,
    config: &PakeConfig,
    tauri_config: &Config,
    opts: WindowBuildOptions,
) -> tauri::Result<WebviewWindow> {
    let WindowBuildOptions {
        label,
        url,
        visible,
        new_window_features,
    } = opts;

    let use_native_window_tabbing = config.multi_window && new_window_features.is_none();

    let prefer_native_window_tabbing = use_native_window_tabbing && label != "pake";

    let _data_dir =
        get_data_dir(app, data_dir_name(config, tauri_config)).map_err(tauri::Error::Io)?;

    let window_config = config.windows.first().ok_or_else(|| {
        tauri::Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            "pake.json must define at least one window configuration",
        ))
    })?;

    let restored_url = if label == "pake" && window_config.remembers_last_url() {
        match app.path().app_data_dir() {
            Ok(directory) => match crate::util::read_last_url(&directory.join("last-url.txt")) {
                Ok(url) => url,
                Err(error) => {
                    eprintln!("[Pake] Could not read the last URL: {error}");
                    None
                }
            },
            Err(error) => {
                eprintln!("[Pake] Could not locate the last URL: {error}");
                None
            }
        }
    } else {
        None
    };

    // On macOS both HTTP Basic auth and certificate bypass use the same
    // navigation-delegate proxy. Start on a neutral page so the proxy is in
    // place before the target can issue its first authentication challenge.

    let auth_target = if label == "pake"
        && window_config.url_type == "web"
        && (config.basic_auth || window_config.ignore_certificate_errors)
    {
        restored_url
            .clone()
            .or_else(|| Url::parse(&window_config.url).ok())
    } else {
        None
    };

    let url = restored_url.map(WebviewUrl::External).unwrap_or(url);

    // The delegate must be installed before the first TLS challenge. Start on
    // a neutral page, then navigate from the with_webview callback below.

    let url = if auth_target.is_some() {
        WebviewUrl::CustomProtocol(
            Url::parse("about:blank").expect("about:blank must be a valid URL"),
        )
    } else {
        url
    };

    let user_agent = config.user_agent.get();

    let config_script = format!(
        "window.pakeConfig = {}",
        serde_json::to_string(&window_config).unwrap_or_else(|_| "{}".to_string())
    );

    // Platform-specific title: macOS prefers empty, others fallback to product name
    let effective_title = window_config.title.as_deref().unwrap_or_else(|| {
        if cfg!(target_os = "macos") {
            ""
        } else {
            tauri_config.product_name.as_deref().unwrap_or("")
        }
    });

    let mut window_builder = WebviewWindowBuilder::new(app, label, url)
        .title(effective_title)
        .visible(visible)
        .user_agent(user_agent)
        .resizable(window_config.resizable)
        .maximized(window_config.maximize);

    {
        window_builder = window_builder.inner_size(window_config.width, window_config.height);
    }

    window_builder = window_builder
        .always_on_top(window_config.always_on_top)
        .incognito(window_config.incognito);

    {
        window_builder = window_builder.fullscreen(window_config.fullscreen);
    }

    if window_config.min_width > 0.0 || window_config.min_height > 0.0 {
        let min_w = if window_config.min_width > 0.0 {
            window_config.min_width
        } else {
            window_config.width
        };
        let min_h = if window_config.min_height > 0.0 {
            window_config.min_height
        } else {
            window_config.height
        };
        window_builder = window_builder.min_inner_size(min_w, min_h);
    }

    if !window_config.enable_drag_drop {
        window_builder = window_builder.disable_drag_drop_handler();
    }

    {
        let allow_new_window = window_config.new_window;
        let app_handle = app.clone();
        let popup_config = config.clone();
        let popup_tauri_config = tauri_config.clone();
        window_builder = window_builder.on_new_window(move |target_url, features| {
            // Even without --new-window, two-stage popups need a real webview
            // with our download delegate, never a proxy for the main window.
            if !allow_new_window && !is_blank_popup_url(&target_url) {
                return NewWindowResponse::Deny;
            }
            match open_requested_window(
                &app_handle,
                &popup_config,
                &popup_tauri_config,
                target_url,
                features,
            ) {
                Ok(window) => NewWindowResponse::Create { window },
                Err(error) => {
                    eprintln!("[Pake] Failed to open requested window: {error}");
                    NewWindowResponse::Deny
                }
            }
        });
    }

    // Add initialization scripts. Order matters: pakeConfig must land before
    // any script that reads it, and toast must register `window.pakeToast`
    // before Rust code calls show_toast().
    window_builder = window_builder
        .initialization_script_for_all_frames(&config_script)
        .initialization_script_for_all_frames(include_str!("../inject/link_policy.js"))
        .initialization_script_for_all_frames(include_str!("../inject/auth.js"))
        .initialization_script_for_all_frames(include_str!("../inject/frame_links.js"));

    // find.js is opt-in via --enable-find and no-ops at runtime when disabled,
    // so only inject its ~700 lines when the feature is on. Avoids parsing the
    // find UI on every page load in the common (find-off) case. Matches the
    // enable_find gating already applied to the Find menu item.
    window_builder = window_builder.initialization_script(include_str!("../inject/styles.js"));

    if window_config.enable_find {
        window_builder = window_builder.initialization_script(include_str!("../inject/find.js"));
    }

    window_builder = window_builder.initialization_script(include_str!("../inject/toast.js"));

    // Install the macOS fullscreen bridge.

    {
        window_builder =
            window_builder.initialization_script(include_str!("../inject/fullscreen.js"));
    }

    window_builder = window_builder
        .initialization_script(include_str!("../inject/event.js"))
        .initialization_script(include_str!("../inject/style.js"))
        .initialization_script(include_str!("../inject/theme_refresh.js"));

    if window_config.title_bar_follows_page() {
        window_builder =
            window_builder.initialization_script(include_str!("../inject/title_bar.js"));
    }

    window_builder = window_builder.initialization_script(
        config
            .runtime_custom_js
            .as_deref()
            .unwrap_or(include_str!("../inject/custom.js")),
    );

    if window_config.enable_wasm {
        {
            window_builder = window_builder
                .additional_browser_args("--enable-features=SharedArrayBuffer")
                .additional_browser_args("--enable-unsafe-webgpu");
        }
    }

    let mut parsed_proxy_url: Option<Url> = None;

    // Default to following the system theme (None), only force dark when explicitly set.
    // Computed once; the matching platform block below is the sole consumer.
    let theme = if window_config.dark_mode {
        Some(Theme::Dark)
    } else {
        None // Follow system theme
    };

    {
        let title_bar_style = if window_config.hide_title_bar {
            TitleBarStyle::Overlay
        } else if window_config.title_bar_follows_page() {
            // The page starts below the bar, so the traffic lights never cover
            // it; title_bar.js paints the bar with the page's top color.
            TitleBarStyle::Transparent
        } else {
            TitleBarStyle::Visible
        };
        window_builder = window_builder.title_bar_style(title_bar_style);
        if window_config.title_bar_follows_page() {
            window_builder = window_builder.hidden_title(true);
        }
        window_builder = window_builder.theme(theme);

        // Tauri disables automatic tabbing unless an identifier is provided.
        // Existing multi-window apps already have a stable bundle identifier,
        // so use it without exposing another CLI/config option. Web-created
        // popups keep their own native window.
        if use_native_window_tabbing {
            window_builder = window_builder
                .tabbing_identifier(&tauri_config.identifier)
                .on_document_title_changed(|window, title| {
                    if !title.trim().is_empty() {
                        if let Err(error) = window.set_title(&title) {
                            eprintln!("[Pake] Failed to update the macOS tab title: {error}");
                        }
                    }
                });
        }
    }

    // Apply the configured macOS webview proxy.
    if parsed_proxy_url.is_none() && !config.proxy_url.is_empty() {
        if let Ok(proxy_url) = Url::from_str(&config.proxy_url) {
            parsed_proxy_url = Some(proxy_url);
        }
    }

    if let Some(proxy_url) = parsed_proxy_url {
        window_builder = window_builder.proxy_url(proxy_url);
        #[cfg(debug_assertions)]
        println!("Proxy configured: {}", config.proxy_url);
    }

    if let Some(features) = new_window_features {
        prepare_macos_new_window_configuration(&features)?;

        window_builder = window_builder.window_features(features).focused(true);
    }

    // Capture webview-initiated downloads (blob:, data:, Content-Disposition,
    // etc.) and write them to the configured download folder. This is essential for
    // sites with a strict Content-Security-Policy (e.g. Gemini): their
    // `connect-src` blocks Tauri's IPC origin, so downloads cannot be routed
    // through the JS bridge, and downloads triggered from a sandboxed iframe
    // can't reach the IPC either. Letting the browser download natively and
    // catching it here is independent of the page CSP and the IPC channel.
    {
        let download_handle = app.clone();
        window_builder = window_builder.on_download(move |webview, event| match event {
            DownloadEvent::Requested { url, destination } => {
                match get_download_dir(&download_handle) {
                    Ok(download_dir) => {
                        let filename = destination
                            .file_name()
                            .map(|name| name.to_string_lossy().to_string())
                            .filter(|name| !name.is_empty())
                            .or_else(|| {
                                url.path_segments()
                                    .and_then(|mut segments| segments.next_back())
                                    .map(|segment| segment.to_string())
                                    .filter(|segment| !segment.is_empty())
                            })
                            .unwrap_or_else(|| "download".to_string());

                        let target = download_dir.join(sanitize_download_filename(&filename));
                        if let Some(path_str) = target.to_str() {
                            *destination = PathBuf::from(check_file_or_append(path_str));
                        } else {
                            eprintln!("[Pake] Download destination is not valid UTF-8");
                            return false;
                        }
                    }
                    Err(error) => {
                        eprintln!("[Pake] Failed to resolve download dir: {error}");
                        if let Some(window) = download_handle.get_webview_window(webview.label()) {
                            show_toast(
                                &window,
                                &get_download_message_with_lang(
                                    MessageType::DirectoryFailure,
                                    None,
                                ),
                            );
                        }
                        return false;
                    }
                }
                true
            }
            DownloadEvent::Finished {
                url: _,
                path: _,
                success,
            } => {
                // Toast on the window that started the download (including
                // secondary multi-window labels), not a hard-coded "pake".
                let toast_window = download_handle
                    .get_webview_window(webview.label())
                    .or_else(|| download_handle.get_webview_window("pake"));
                if let Some(window) = toast_window {
                    let message_type = if success {
                        MessageType::Success
                    } else {
                        MessageType::Failure
                    };
                    show_toast(&window, &get_download_message_with_lang(message_type, None));
                }
                true
            }
            _ => true,
        });
    }

    window_builder = window_builder.on_navigation(|_| true);

    let window = window_builder.build()?;

    // Every webview is built here (main window, Cmd+N clones, --new-window and
    // blank two-stage popups), so trackpad history swipes match in all of them.

    #[cfg(target_os = "macos")]
    if let Err(error) = window.with_webview(|webview| {
        crate::app::navigation::enable_back_forward_gestures(&webview);
    }) {
        eprintln!("[Pake] Failed to access WKWebView for history swipe gestures: {error}");
    }

    // The tab bar's + button exists only while some window class answers
    // `newWindowForTab:`. Install it for every tabbing window, the main one
    // included: its tab bar is the one the user sees first.

    if use_native_window_tabbing {
        crate::app::tab_bar::install_new_tab_action(app, &window);
    }

    // A shared identifier alone leaves each NSWindow in automatic mode.
    // Prefer tabs only for Cmd+N clones so they join the main window's tab
    // group. The main window stays bar-less until another tab exists, while
    // web-auth and window.open popups remain separate native windows.

    if prefer_native_window_tabbing {
        let tabbing_window = window.clone();
        Queue::main().exec_async(move || match tabbing_window.ns_window() {
            Ok(ns_window_ptr) => unsafe {
                let Some(ns_window) =
                    objc2::rc::Retained::retain(ns_window_ptr as *mut objc2_app_kit::NSWindow)
                else {
                    eprintln!("[Pake] Failed to retain the macOS window for tabbing.");
                    return;
                };
                ns_window.setTabbingMode(objc2_app_kit::NSWindowTabbingMode::Preferred);
            },
            Err(error) => {
                eprintln!("[Pake] Failed to access the macOS window for tabbing: {error}");
            }
        });
    }

    // WKWebView does not show an HTTP Basic login dialog and ignores Chromium's
    // certificate-error flag. Install one host-scoped delegate for both flows
    // on the process-lifetime main window, then navigate to the real target.

    if let Some(target_url) = auth_target {
        let allowed_host = target_url
            .host_str()
            .expect("web URLs must have a host")
            .to_owned();
        let prompt_for_basic_auth = config.basic_auth;
        let allow_invalid_certificates = window_config.ignore_certificate_errors;
        let auth_window = window.clone();
        Queue::main().exec_async(move || {
            if let Err(error) = auth_window.with_webview(move |webview| {
                if !crate::app::auth::install_auth_delegate_and_navigate(
                    webview.inner(),
                    allowed_host,
                    target_url.to_string(),
                    prompt_for_basic_auth,
                    allow_invalid_certificates,
                ) {
                    eprintln!("[Pake] Failed to configure macOS authentication handling.");
                }
            }) {
                eprintln!("[Pake] Failed to access the macOS webview: {error}");
            }
        });
    }

    Ok(window)
}

pub fn save_last_url(app: &AppHandle) {
    let Some(window) = app.get_webview_window("pake") else {
        return;
    };
    let result = (|| -> Result<(), Box<dyn std::error::Error>> {
        let path = app.path().app_data_dir()?.join("last-url.txt");
        crate::util::write_last_url(&path, &window.url()?)?;
        Ok(())
    })();
    if let Err(error) = result {
        eprintln!("[Pake] Could not save the last URL: {error}");
    }
}

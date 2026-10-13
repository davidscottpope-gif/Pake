//! macOS webview navigation that does not depend on page JS.
//! Blank error shells have no JS context, so `eval("history.back()")` and
//! `location.reload()` are dead exactly when the user is stuck.

use tauri::WebviewWindow;

/// Reload the current document via the native webview API.
pub fn reload_window(window: &WebviewWindow) {
    if let Err(error) = window.reload() {
        eprintln!("[Pake] Failed to reload webview: {error}");
    }
}

/// Step the webview history without requiring a live page JS context.
pub fn history_step(window: &WebviewWindow, back: bool) {
    let stepped = window.with_webview(move |webview| {
        history_step_platform(&webview, back);
    });

    if stepped.is_err() {
        // Last resort when with_webview is unavailable (rare). Still fails on
        // blank error shells, but preserves SPA history when the page is live.
        let script = if back {
            "window.history.back()"
        } else {
            "window.history.forward()"
        };
        if let Err(error) = window.eval(script) {
            eprintln!("[Pake] Failed to step webview history: {error}");
        }
    }
}

/// Let a two-finger horizontal trackpad swipe step history, as in Safari.
///
/// WKWebView leaves `allowsBackForwardNavigationGestures` off, and Tauri does
/// not expose Wry's builder switch, so set it on the native view directly.
#[cfg(target_os = "macos")]
pub fn enable_back_forward_gestures(webview: &tauri::webview::PlatformWebview) {
    use objc2::msg_send;
    use objc2::runtime::{AnyObject, Bool};

    let ptr = webview.inner() as *mut AnyObject;
    if ptr.is_null() {
        eprintln!("[Pake] Failed to access WKWebView for history swipe gestures");
        return;
    }
    unsafe {
        let _: () = msg_send![ptr, setAllowsBackForwardNavigationGestures: Bool::YES];
    }
}

#[cfg(target_os = "macos")]
fn history_step_platform(webview: &tauri::webview::PlatformWebview, back: bool) {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;

    let ptr = webview.inner() as *mut AnyObject;
    if ptr.is_null() {
        return;
    }
    unsafe {
        if back {
            let _: *mut AnyObject = msg_send![ptr, goBack];
        } else {
            let _: *mut AnyObject = msg_send![ptr, goForward];
        }
    }
}

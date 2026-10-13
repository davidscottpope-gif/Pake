# Frequently Asked Questions (FAQ)

<div align="center">

**English** · [中文](faq_CN.md)

</div>

Common issues and solutions when using Pake.

## Table of Contents

- [Build Issues](#build-issues)
  - [Rust Version Error: "feature 'edition2024' is required"](#rust-version-error-feature-edition2024-is-required)
  - [macOS: Build Fails with Module Compilation Errors](#macos-build-fails-with-module-compilation-errors)
- [Runtime Issues](#runtime-issues)
  - [App Window is Too Small/Large](#app-window-is-too-smalllarge)
  - [App Icon Not Showing Correctly](#app-icon-not-showing-correctly)
  - [Website Features Not Working (Login, Upload, etc.)](#website-features-not-working-login-upload-etc)
  - [App Uses More Memory Than Expected](#app-uses-more-memory-than-expected)
- [Installation Issues](#installation-issues)
  - [Running Without a Global Link](#running-without-a-global-link)
- [Getting Help](#getting-help)

## Build Issues

### Rust Version Error: "feature 'edition2024' is required"

When building Pake or using the CLI, you encounter an error like:

```txt
error: failed to parse manifest
Caused by:
  feature `edition2024` is required
  this Cargo does not support nightly features, but if you switch to nightly channel you can add `cargo-features = ["edition2024"]
  to enable this feature
```

**Why This Happens:**

Pake's dependency chain from `tauri` through `image` and `moxcms` to `pxfm v0.1.25` requires Rust edition2024, which became stable in Rust 1.85.0 (released February 2025). If your Rust version is older (e.g., 1.82.0 from August 2024), you'll see this error.

Update your Rust toolchain to version 1.85.0 or later, then retry your build command:

```bash
# Update to the latest stable Rust version
rustup update stable

# Or install the latest stable version
rustup install stable

# Verify the update
rustc --version
# Should show: rustc 1.85.0 or higher
```

A development environment needs:

- Rust ≥1.85.0 (check with `rustc --version`)
- Node.js ≥20.9.0 (check with `node --version`)

See [CONTRIBUTING.md](../CONTRIBUTING.md) for complete prerequisites.

### macOS: Build Fails with Module Compilation Errors

On macOS 26 Beta or newer, you may see errors related to `CoreFoundation` or `_Builtin_float` modules.

Create a configuration file to use compatible SDK:

```bash
cat > src-tauri/.cargo/config.toml << 'EOF'
[env]
MACOSX_DEPLOYMENT_TARGET = "15.0"
SDKROOT = "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk"
EOF
```

This file is already in `.gitignore` and won't be committed.

## Runtime Issues

### App Window is Too Small/Large

Specify custom dimensions when building:

```bash
pake https://example.com --width 1200 --height 800
```

See [CLI Usage Guide](cli-usage.md#width) for all window options.

### App Icon Not Showing Correctly

Custom icon doesn't appear or shows default icon.

Ensure you're using the correct icon format:

- **macOS**: `.icns` format

```bash
pake https://example.com --icon ./icon.icns
```

Pake can automatically convert icons, but providing the correct format is more reliable.

### Website Features Not Working (Login, Upload, etc.)

Some website features don't work in the Pake app.

This is usually due to web compatibility issues. Try:

1. **Set custom User Agent:**

   ```bash
   pake https://example.com --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
   ```

2. **Inject custom JavaScript:**

   ```bash
   pake https://example.com --inject ./fix.js
   ```

   For pages that need periodic reloads, you can keep this behavior in a small injected script instead of adding a dedicated Pake option:

   ```javascript
   function isEditing(element) {
     if (!element) return false;
     const tagName = element.tagName;
     return (
       element.isContentEditable ||
       tagName === "INPUT" ||
       tagName === "TEXTAREA" ||
       tagName === "SELECT"
     );
   }

   setInterval(() => {
     if (!document.hidden && !isEditing(document.activeElement)) {
       window.location.reload();
     }
   }, 300000);
   ```

   Save it as `refresh.js` and package with:

   ```bash
   pake https://news.ycombinator.com --name HackerNews --inject ./refresh.js
   ```

3. **Check if the site requires specific permissions** that may not be available in WebView

4. **Be aware of embedded-webview sign-in limits**

   Some authentication providers, especially Google, may block sign-in inside embedded webviews. Because Pake packages sites into a desktop webview, Google properties or sites that rely on Google OAuth may still fail to sign in even when `--new-window` or `--multi-window` is enabled. This is provider policy, not a packaging bug, so use the normal browser, a browser-installed app, or a native desktop client for those sites.

   On macOS, Pake keeps **Sign in with Apple** popup flows (e.g. Yelp, Upwork) on the native popup path so Apple's callback can return to the opener page. Other auth popups may still be navigated in the current window to avoid WebKit crashes.

5. **WeChat Web login environment error**

   WeChat detects the WebView and writes a flag cookie that blocks subsequent logins. Add `--incognito` when packaging to bypass it, at the cost of requiring a QR scan on every launch:

   ```bash
   pake https://wx.qq.com --name WeChat --incognito
   ```

6. **Cloudflare or bot-verification loops forever**

   Some sites (e.g. ChatGPT) put a Cloudflare challenge in front of the page. The system WebView is often flagged by these challenges and loops without passing, even with a custom `--user-agent`. This is the challenge provider detecting a non-standard browser engine, not a Pake bug, and there is no reliable Pake-side workaround. As with item 4, use the site in a regular browser or a native client when it gates behind such a check.

### App Uses More Memory Than Expected

The app spawns a WebContent process that uses several hundred MB of RAM, which seems to contradict the README's "typically under 10 MB" figure.

**Explanation:**

That number is the installer size on disk, not runtime memory. At runtime Pake renders through your system WebView (WKWebView on macOS), and that process's memory is governed by the engine and the page you load, not by Pake. A heavy SPA like Gemini, Slack, or ChatGPT uses a comparable amount opening in Safari. Pake adds very little on top of the WebView, so there is no Pake-side setting that meaningfully lowers it. This is inherent to using the system WebView and is the trade-off for the small binary size.

## Installation Issues

### Running Without a Global Link

If `npm link` lacks permission, use this fork from its checkout without changing global npm or shell settings:

```bash
pnpm run cli:build
node dist/cli.js https://example.com --name Example
```

## Getting Help

If your issue isn't covered here:

1. Check the [CLI Usage Guide](cli-usage.md) for detailed parameter documentation
2. See [Advanced Usage](advanced-usage.md) for prerequisites and system setup
3. Search [existing GitHub issues](https://github.com/tw93/Pake/issues)
4. [Open a new issue](https://github.com/tw93/Pake/issues/new) with:
   - Your OS and version
   - Node.js and Rust versions (`node --version`, `rustc --version`)
   - Complete error message
   - Build command you used

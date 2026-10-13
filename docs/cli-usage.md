# CLI Usage Guide

<div align="center">

**English** · [中文](cli-usage_CN.md)

</div>

Complete command-line reference and basic usage for Pake CLI.

## Installation

This personal Mac-only fork is not the cross-platform `pake-cli` package on npm. Build this branch locally on macOS:

```bash
git clone --single-branch --branch feature/macos-only-ts-js-cleanup https://github.com/davidscottpope-gif/Pake.git Pake-mac
cd Pake-mac
pnpm install --frozen-lockfile
pnpm run cli:build
npm link
```

Requires Node.js 22, pnpm 10.26.2, Rust 1.95.0 and Xcode Command Line Tools. This does not publish to npm.

## Quick Start

```bash
# Basic usage, fetches the website icon automatically
pake https://github.com --name "GitHub"

# Advanced usage, custom options
pake https://weekly.tw93.fun --name "Weekly" --icon https://cdn.tw93.fun/pake/weekly.icns --width 1200 --height 800 --hide-title-bar

# Complete example, multiple options combined
pake https://github.com --name "GitHub Desktop" --width 1400 --height 900 --show-system-tray --debug
```

## CLI Usage

```bash
pake [url] [options]
```

The packaged application will be located in the current working directory by default. The first build sets up the environment and takes longer, later builds are fast.

> **macOS Output**: On macOS, Pake creates DMG installers by default. To create `.app` bundles for testing (to avoid user interaction), set the environment variable `PAKE_CREATE_APP=1`. If you want Pake to install the app directly into `/Applications`, use `--install`, which builds an `.app`, copies it into `/Applications`, and removes the local bundle after a successful install.
>
> **Rust**: Packaging requires Rust. If it is missing, you will be asked whether to install it, and if installation fails or times out, you can [install it manually](https://www.rust-lang.org/tools/install).

### [url]

The URL is the link to the web page you want to package, the path to a local HTML file, or the path to a directory of static web files containing an `index.html` at its root (e.g. a `dist/` build output). Mandatory unless a `--config` file provides `url`.

Web apps remember the main window’s full URL when closed or quit and reopen it on the next launch. The packaged URL remains the home address and is used when no saved URL is available. Incognito apps and local HTML apps do not save or restore URLs.

```shell
pake https://example.com --name Example
pake ./page.html --name MyPage
pake ./dist --name MyTool
```

For local packaging, hash-based routing works out of the box; history-mode SPA routing is not yet supported.

### [options]

The table lists the common options, `pake --help` shows every option, and each one is documented in full below.

| Option             | Description                                        | Example                                        |
| ------------------ | -------------------------------------------------- | ---------------------------------------------- |
| `--name`           | Application name                                   | `--name "Weekly"`                              |
| `--icon`           | Custom icon (optional, auto-fetch website icon)    | `--icon https://cdn.tw93.fun/pake/weekly.icns` |
| `--width`          | Window width (default: 1200px)                     | `--width 1400`                                 |
| `--height`         | Window height (default: 780px)                     | `--height 900`                                 |
| `--hide-title-bar` | Immersive header (macOS only)                      | `--hide-title-bar`                             |
| `--debug`          | Enable development tools                           | `--debug`                                      |
| `--config`         | Load options from a JSON config file               | `--config app.json`                            |
| `--json`           | Machine-readable result on stdout (for automation) | `--json`                                       |
| `--help`           | Show all CLI options                               | `--help`                                       |
| `--version`        | Show CLI version                                   | `--version`                                    |

#### [name]

Specify the application name. If not provided, you will be prompted to enter it. English names work best, and names with spaces are handled per platform:

- **macOS**: Preserves spaces and case (e.g., `"Google Translate"`)

```shell
--name <string>
--name MyApp

# Multiple words (if needed):
--name "Google Translate"
```

#### [icon]

**Optional parameter**: If not provided, Pake will automatically fetch the website's icon and convert to the appropriate format. For custom icons, visit [icon-icons](https://icon-icons.com) or [macOSicons](https://macosicons.com/#/).

Supports both local and remote files, automatically converts to platform-specific formats:

- macOS: `.icns` format

```shell
--icon <path>

# Examples:
# Without --icon parameter, auto-fetch website icon
pake https://github.com --name GitHub

# With custom icons
--icon ./my-icon.png
--icon https://cdn.tw93.fun/pake/weekly.icns  # Remote icon (.icns for macOS)
```

#### [width]

Set the width of the application window. Default is `1200px`.

```shell
--width <number>
```

#### [height]

Set the height of the application window. Default is `780px`.

```shell
--height <number>
```

#### [min-width]

Set the minimum width that the window can be resized to. Keeps layouts usable when the window is dragged small.

```shell
--min-width <number>
```

#### [min-height]

Set the minimum height that the window can be resized to. Prevents UI breakage caused by very short windows.

```shell
--min-height <number>
```

#### [zoom]

Set initial page zoom level as an integer between 50 and 200. Default is `100`. Users can still adjust with `Cmd/Ctrl +/-/0` shortcuts.

```shell
--zoom <number>
--zoom 80   # 80%
--zoom 120  # 120%
```

#### [hide-title-bar]

Enable or disable immersive header. Default is `false`. Use the following command to enable this feature, macOS only.

```shell
--hide-title-bar
```

#### [fullscreen]

Determine whether the application launches in full screen. Default is `false`. Use the following command to enable full screen.

```shell
--fullscreen
```

#### [maximize]

Determine whether the application launches with a maximized window. Default is `false`. Use the following command to enable maximize.

```shell
--maximize
```

#### [activation-shortcut]

Set the activation shortcut for the application. Default is empty, so it does not take effect. You can customize the activation shortcut with the following commands, e.g. `CmdOrControl+Shift+P`. Usage can refer to [available-modifiers](https://www.electronjs.org/docs/latest/api/accelerator#available-modifiers).

```shell
--activation-shortcut <string>
```

#### [always-on-top]

Sets whether the window is always at the top level, defaults to `false`.

```shell
--always-on-top
```

#### [app-version]

Set the version number of the packaged application to be consistent with the naming format of version in package.json, defaulting to `1.0.0`.

```shell
--app-version <string>
```

#### [dark-mode]

Force packaging applications using dark mode (macOS), default is `false`.

```shell
--dark-mode
```

#### [disabled-web-shortcuts]

Sets whether to disable web shortcuts in the original Pake container, defaults to `false`.

```shell
--disabled-web-shortcuts
```

#### [enable-find]

Enable Pake's in-page Find UI. Default is `false`. When enabled, users can press `Cmd/Ctrl+F` to open Find, `Cmd/Ctrl+G` to jump to the next match, and `Cmd/Ctrl+Shift+G` to jump to the previous match.

```shell
--enable-find
```

#### [force-internal-navigation]

Keeps every clicked link (even pointing to other domains) inside the Pake window instead of letting the OS open an external browser or helper. Default is `false`.

```shell
--force-internal-navigation
```

#### [internal-url-regex]

Set a regex pattern to determine which URLs should be considered internal (opened within the app). When set, this pattern takes precedence over the default domain-based matching. Useful when you want to limit internal navigation to specific paths on a domain.

```shell
--internal-url-regex <pattern>

# Example: Only treat facebook.com/messages paths as internal
--internal-url-regex "^https://www\\.facebook\\.com/messages(/.*)?$"

# Example: Only treat specific subdomains as internal
--internal-url-regex "^https://(app|api)\\.example\\.com"
```

#### [safe-domain]

A simpler way to keep trusted domains and their subdomains inside the app. This is useful for workspace callbacks and enterprise SSO flows, for example Slack plus Okta. Pake compiles this list into `internal_url_regex`; if `--internal-url-regex` is also set, the explicit regex wins.

`--safe-domain` matches URL hosts only, not arbitrary path or query text.

```shell
--safe-domain <domains>

# Keep Slack and Okta auth redirects inside the app
--safe-domain slack.com,okta.com
```

#### [multi-arch]

Package the application to support both Intel and M1 chips, exclusively for macOS. Default is `false`.

##### Prerequisites

- After enabling this option, Rust must be installed using rustup from the official Rust website. Installation via brew is not supported.
- For Intel chip users, install the arm64 cross-platform package to support M1 chips using the following command:

  ```shell
  rustup target add aarch64-apple-darwin
  ```

- For M1 chip users, install the x86 cross-platform package to support Intel chips using the following command:

  ```shell
  rustup target add x86_64-apple-darwin
  ```

##### Usage

```shell
--multi-arch
```

#### [targets]

Specify the build target architecture or format:

- **macOS**: `intel`, `apple`, `universal` (architecture, auto-detects if not specified); `app`, `dmg` (output format, default: `dmg`)

```shell
--targets <target>

# Examples:
--targets universal      # macOS Universal (Intel + Apple Silicon)
--targets apple          # macOS Apple Silicon only
--targets intel          # macOS Intel only
--targets app            # macOS app bundle only (.app, skips the DMG step)
--targets dmg            # macOS DMG installer (default)
```

#### [user-agent]

Customize the browser user agent. Default is empty.

```shell
--user-agent <string>
```

#### [show-system-tray]

Display the application in system tray. Default is `false`.

```shell
--show-system-tray
```

#### [system-tray-icon]

Specify the system tray icon. This is only effective when the system tray is enabled. The icon must be in `.png` format and should be an image with dimensions ranging from 32x32 to 256x256 pixels.

```shell
--system-tray-icon <path>
```

#### [hide-on-close]

Hide window instead of closing the application when clicking close button. Default: `true`.

```shell
# Hide on close (default behavior on macOS)
--hide-on-close
--hide-on-close true

# Close application immediately
--hide-on-close false
```

#### [start-to-tray]

Start the application minimized to system tray instead of showing the window. Must be used with `--show-system-tray`. Default is `false`.

```shell
--start-to-tray

# Example: Start hidden to tray (must use with --show-system-tray)
pake https://github.com --name GitHub --show-system-tray --start-to-tray
```

Double-click the tray icon to show or hide the window. Without `--show-system-tray`, this option is ignored.

#### [title]

Set the window title bar text. macOS shows no title if not specified.

```shell
--title <string>

# Examples:
--title "My Application"
--title "Google Translate"
```

#### [no-restore-last-url]

Web apps restore the main window's last URL by default. Use this option to open the packaged URL on every launch while keeping cookies, local storage, and login sessions. In a `--config` JSON file, set `"restoreLastUrl": false`. Incognito sessions and local pages do not restore URLs.

```shell
pake https://www.rememberthemilk.com --name RememberTheMilk --no-restore-last-url
```

#### [incognito]

Launch the application in incognito/private browsing mode. Default is `false`. When enabled, the webview will run in private mode, which means it won't store cookies, local storage, or browsing history. This is useful for privacy-sensitive applications.

```shell
--incognito
```

#### [wasm]

Enable WebAssembly support with cross-origin isolation headers. Required for Flutter Web applications and other web applications that use WebAssembly modules like `sqlite3.wasm`, `canvaskit.wasm`. Default is `false`.

This option adds necessary HTTP headers (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`) and browser flags to enable SharedArrayBuffer and WebAssembly features.

```shell
--wasm

# Example: Package a Flutter Web app with WASM support
pake https://flutter.dev --name FlutterApp --wasm
```

#### [enable-drag-drop]

Enable native drag and drop functionality within the application. Default is `false`. When enabled, allows drag and drop operations like reordering items, file uploads, and other interactive drag behaviors that work in regular browsers.

```shell
--enable-drag-drop

# Example: Package an app that requires drag-drop functionality
pake https://planka.example.com --name PlankApp --enable-drag-drop
```

#### [keep-binary]

Keep the raw binary file alongside the installer. Default is `false`. When enabled, also outputs a standalone executable that can run without installation.

```shell
--keep-binary

# Example: Package app with both installer and standalone binary
pake https://github.com --name GitHub --keep-binary
```

**Output**: Creates both installer and standalone executable (`AppName-binary`).

#### [iterative-build]

macOS only: build the `.app` and skip DMG packaging, good for debugging. Default is `false`.

```shell
--iterative-build
```

#### [install]

Install the built macOS app directly into `/Applications`. Default is `false`.

This option is macOS-only and is intended for local development or quick testing. When enabled, Pake builds an `.app` bundle, copies it into `/Applications`, replaces any existing app with the same name, and removes the local bundle after a successful install. If the install fails, the local `.app` is kept in the current working directory.

```shell
--install

# Example: Build and install directly to /Applications
pake https://github.com --name GitHub --install
```

#### [camera]

Request camera access on macOS by adding the `com.apple.security.device.camera` entitlement to the packaged app. Default is `false`. macOS only. Useful for web apps that need webcam access, such as video calls or QR scanning.

```shell
--camera

# Example: Package a video-call site with camera access
pake https://meet.google.com --name Meet --camera
```

#### [microphone]

Request microphone access on macOS by adding the `com.apple.security.device.audio-input` entitlement to the packaged app. Default is `false`. macOS only.

```shell
--microphone

# Example: Combine camera and microphone for a conferencing app
pake https://meet.google.com --name Meet --camera --microphone
```

#### [multi-instance]

Allow the packaged app to run more than one instance at the same time. Default is `false`, which means launching a second instance simply focuses the existing window. Enable this when you need to open several windows of the same app simultaneously.

```shell
--multi-instance

# Example: Allow multiple chat windows
pake https://chat.example.com --name ChatApp --multi-instance
```

#### [multi-window]

Allow opening multiple windows within a single running app instance. Default is `false`.

This is different from `--multi-instance`:

- `--multi-instance`: starts multiple app processes.
- `--multi-window`: keeps one process and opens extra windows from that process.

When enabled, relaunching an already running app opens a new window instead of only focusing the existing one.

On macOS, additional windows opened with Cmd+N join the app's native tab group. Web-auth and `window.open` popups remain separate.

This can improve popup-based authentication flows, but it cannot bypass provider policy. Some providers, especially Google, may still reject sign-in inside embedded webviews.

```shell
--multi-window

# Example: Keep one process but open multiple windows
pake https://chat.example.com --name ChatApp --multi-window
```

#### [use-local-file]

Enable recursive copying. When the URL is a local file path, enabling this option will copy the folder containing the file specified in the URL, as well as all sub-files, to the Pake static folder. This is disabled by default.

Directory inputs (`pake ./dist`) always package the full tree; this flag only affects single-HTML-file inputs.

```shell
--use-local-file

# Basic static file packaging
pake ./my-app/index.html --name "my-app" --use-local-file
```

#### [inject]

Using `inject`, you can inject local absolute and relative path `css` and `js` files into the page you specify the `url` to customize it. For example, an adblock script that can be applied to any web page, or a `css` that optimizes the `UI` of a page, you can write it once to customize it. would only need to write the `app` once to generalize it to any other page.

Supports both comma-separated and multiple option formats:

```shell
# Comma-separated (recommended)
--inject ./tools/style.css,./tools/hotkey.js

# Multiple options
--inject ./tools/style.css --inject ./tools/hotkey.js

# Single file
--inject ./tools/style.css
```

#### [download-dir]

Choose where the packaged app saves downloads. Both regular link downloads and native browser downloads use this directory; the default is the system Downloads folder.

```bash
pake https://example.com --name MyApp --download-dir '~/Documents/MyApp'
```

Use an absolute path (such as `/Users/alice/Documents/MyApp`) or a quoted `~/path`. Quoting preserves `~` so it resolves to the app user's home when the app runs, rather than the build machine's home. Missing directories are created on the first download. Relative paths are rejected; an inaccessible directory causes the download to fail without silently saving elsewhere. The equivalent JSON config field is `downloadDir`. Rebuild an existing app to change its download directory.

#### [proxy-url]

Set proxy server for all network requests. Supports HTTP, HTTPS, and SOCKS5. Requires macOS 14+.

```shell
--proxy-url http://127.0.0.1:7890
--proxy-url socks5://127.0.0.1:7891
```

#### [basic-auth]

Prompt for HTTP Basic credentials when the target site requests them. This is only needed on macOS, where WKWebView does not provide its own 401 login dialog. Credentials are entered in the packaged app at runtime and are kept only for the current session.

```shell
--basic-auth
```

#### [debug]

Enable developer tools and detailed logging for debugging.

```shell
--debug
```

#### [config]

Load options from a declarative JSON config file instead of assembling flags. Fields are the camelCase CLI option names plus `url`; the published schema is [schema/pake.schema.json](../schema/pake.schema.json). An explicit CLI flag always wins over a config field. Unknown fields, wrong types, and out-of-range numbers fail fast. A relative `url` path resolves against the current working directory, not the config file's location. Invocation flags (`--json`, `--config`, `--version`) are CLI-only and rejected inside the file.

```shell
--config <path>

# app.json
# {
#   "$schema": "https://raw.githubusercontent.com/tw93/Pake/main/schema/pake.schema.json",
#   "url": "https://example.com",
#   "name": "MyApp",
#   "width": 1280,
#   "hideTitleBar": true
# }
pake --config app.json
```

#### [json]

Machine-readable mode for scripts and AI agents. All logs move to stderr and stdout carries exactly one JSON result object; interactive prompts are disabled (they are also disabled whenever stdin is not a TTY).

```shell
--json

# Success (stdout):
# {"ok":true,"name":"MyApp","platform":"darwin","arch":"arm64",
#  "outputs":[{"path":"/abs/MyApp.dmg","sizeBytes":5242880,"format":"dmg"}],
#  "warnings":[],"error":null}
#
# Failure (stdout):
# {"ok":false, ..., "error":{"code":"ENV_MISSING","message":"...","hint":"..."}}
```

Exit codes: `0` success, `2` invalid input, `3` build failure, `4` missing environment or dependency setup failure (e.g. Rust not installed, package install failed), `1` unexpected error. Error codes: `INVALID_INPUT`, `ENV_MISSING`, `BUILD_FAILED`, `UNEXPECTED`, plus `NETWORK` (reserved; current versions report network failures under the phase code).

On multi-target builds, `ok` can be true with fewer `outputs` than requested: a target that fails while others succeed is reported in `warnings`, not as a failure. Check `outputs[].format` against the formats you asked for.

#### [ignore-certificate-errors]

Ignore TLS certificate validation errors when loading the target URL. Useful for intranet apps, dev servers, or self-signed certificates.

```shell
--ignore-certificate-errors
```

#### [new-window]

Allow sites to open new windows, such as authentication popups, extra tabs, or branch views.

This can help sites that rely on popup auth windows, but it does not guarantee in-app sign-in. Some providers, especially Google, may block authentication inside embedded webviews regardless of this option.

```shell
--new-window
```

# 常见问题 (FAQ)

<div align="center">

[English](faq.md) · **中文**

</div>

使用 Pake 时的常见问题和解决方案。

## 目录

- [构建问题](#构建问题)
  - [Rust 版本错误："feature 'edition2024' is required"](#rust-版本错误feature-edition2024-is-required)
  - [macOS：构建失败，出现模块编译错误](#macos构建失败出现模块编译错误)
- [运行时问题](#运行时问题)
  - [应用窗口太小/太大](#应用窗口太小太大)
  - [应用图标显示不正确](#应用图标显示不正确)
  - [网站功能不工作（登录、上传等）](#网站功能不工作登录上传等)
  - [应用占用内存比预期高](#应用占用内存比预期高)
- [安装问题](#安装问题)
  - [不使用全局链接运行](#不使用全局链接运行)
- [获取帮助](#获取帮助)

## 构建问题

### Rust 版本错误："feature 'edition2024' is required"

在构建 Pake 或使用 CLI 时，遇到如下错误：

```txt
error: failed to parse manifest
Caused by:
  feature `edition2024` is required
  this Cargo does not support nightly features, but if you switch to nightly channel you can add `cargo-features = ["edition2024"]`
  to enable this feature
```

**原因分析：**

Pake 的依赖链 `tauri`、`image`、`moxcms` 一直到 `pxfm v0.1.25` 需要 Rust edition2024，它在 Rust 1.85.0（2025 年 2 月发布）中成为稳定版，如果你的 Rust 版本较旧（例如 2024 年 8 月的 1.82.0），就会看到此错误。

将 Rust 工具链更新到 1.85.0 或更高版本，更新后重新执行构建命令：

```bash
# 更新到最新稳定版 Rust
rustup update stable

# 或者安装最新稳定版
rustup install stable

# 验证更新
rustc --version
# 应显示：rustc 1.85.0 或更高版本
```

设置开发环境时需要：

- Rust ≥1.85.0（使用 `rustc --version` 检查）
- Node.js ≥20.9.0（使用 `node --version` 检查）

详见 [CONTRIBUTING.md](../CONTRIBUTING.md) 获取完整的前置条件。

### macOS：构建失败，出现模块编译错误

在 macOS 26 Beta 或更新版本上，可能看到与 `CoreFoundation` 或 `_Builtin_float` 模块相关的错误。

创建配置文件以使用兼容的 SDK：

```bash
cat > src-tauri/.cargo/config.toml << 'EOF'
[env]
MACOSX_DEPLOYMENT_TARGET = "15.0"
SDKROOT = "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk"
EOF
```

此文件已在 `.gitignore` 中，不会被提交。

## 运行时问题

### 应用窗口太小/太大

构建时指定自定义尺寸，所有窗口选项见 [CLI 使用指南](cli-usage_CN.md#width)：

```bash
pake https://example.com --width 1200 --height 800
```

### 应用图标显示不正确

自定义图标没有显示或显示默认图标。

确保使用正确的图标格式：

- **macOS**：`.icns` 格式

```bash
pake https://example.com --icon ./icon.icns
```

Pake 可以自动转换图标，但提供正确的格式更可靠。

### 网站功能不工作（登录、上传等）

某些网站功能在 Pake 应用中无法工作。

这通常是 Web 兼容性问题，可以尝试：

1. **设置自定义 User Agent：**

   ```bash
   pake https://example.com --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
   ```

2. **注入自定义 JavaScript：**

   ```bash
   pake https://example.com --inject ./fix.js
   ```

   需要定时刷新的页面，把这类行为放在一个小的注入脚本里就行，不用增加专门的 Pake 参数：

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

   将其保存为 `refresh.js`，然后这样打包：

   ```bash
   pake https://news.ycombinator.com --name HackerNews --inject ./refresh.js
   ```

3. **检查网站是否需要 WebView 中可能不可用的特定权限**

4. **注意嵌入式 WebView 的登录限制**

   某些认证提供方，尤其是 Google，可能会阻止在嵌入式 WebView 中完成登录。由于 Pake 是把网站包装进桌面 WebView，Google 自家站点或依赖 Google OAuth 的网站，即使启用了 `--new-window` 或 `--multi-window`，也仍然可能无法在应用内完成登录。这属于提供方策略限制，不是打包逻辑错误，这类站点改用普通浏览器、浏览器安装版站点应用或官方原生桌面客户端。

   在 macOS 上，Pake 会让 **Sign in with Apple**（弹窗模式，例如 Yelp、Upwork）继续走原生弹窗路径，确保 Apple 的回调可以返回原页面。其他认证弹窗仍可能在当前窗口内跳转，以规避 WebKit 崩溃。

5. **微信 Web 版登录环境异常**

   微信检测到 WebView 后会写入标记 Cookie，导致后续持续被拦截。打包时加 `--incognito` 可解决，代价是每次启动都需要重新扫码登录：

   ```bash
   pake https://wx.qq.com --name WeChat --incognito
   ```

6. **Cloudflare 或人机验证一直循环**

   某些站点（例如 ChatGPT）会在页面前加一层 Cloudflare 验证。系统 WebView 经常被这类验证判定为非标准浏览器而一直循环、无法通过，即使加了自定义 `--user-agent` 也无效。这是验证服务在识别浏览器引擎，不是 Pake 的 bug，Pake 侧没有可靠的绕过手段，和上面第 4 条一样，这类站点改用普通浏览器或官方原生客户端。

### 应用占用内存比预期高

应用会启动一个 WebContent 进程，占用几百 MB 内存，看起来和 README 里通常小于 10 MB 的说法矛盾。

**说明：**

这个体积指的是安装包在磁盘上的大小，不是运行时内存。运行时 Pake 通过系统 WebView 渲染（macOS 上是 WKWebView），这个进程的内存由引擎和你加载的页面决定，不由 Pake 控制。像 Gemini、Slack、ChatGPT 这类重型 SPA，用 Safari 打开也会占用差不多的内存。Pake 在 WebView 之上几乎不增加额外开销，所以没有能显著降低它的 Pake 侧设置。这是使用系统 WebView 的固有代价，也是换取极小安装体积的取舍。

## 安装问题

### 不使用全局链接运行

如果 `npm link` 权限不足，可直接在此分支的目录中运行，无需修改全局 npm 或 shell 设置：

```bash
pnpm run cli:build
node dist/cli.js https://example.com --name Example
```

## 获取帮助

如果遇到的问题未在此处列出：

1. 查看 [CLI 使用指南](cli-usage_CN.md) 了解详细参数说明
2. 参阅 [高级用法](advanced-usage_CN.md) 了解系统依赖与前置设置
3. 搜索 [现有的 GitHub issues](https://github.com/tw93/Pake/issues)
4. [提交新 issue](https://github.com/tw93/Pake/issues/new) 时附带：
   - 操作系统与系统版本
   - Node.js 与 Rust 版本（`node --version`、`rustc --version`）
   - 完整的错误日志
   - 使用的构建命令

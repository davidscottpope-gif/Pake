# Pake Action

<div align="center">

**English** · [中文](pake-action_CN.md)

</div>

Call Pake from your own GitHub Actions workflow to turn any webpage into a lightweight desktop app in a single step. To build online without writing a workflow, see [GitHub Actions Usage](github-actions-usage.md).

## Quick Start

```yaml
- name: Build Pake App
  uses: davidscottpope-gif/Pake@feature/macos-only-ts-js-cleanup
  with:
    url: "https://example.com"
    name: "MyApp"
```

## Inputs

| Parameter    | Description              | Required | Default |
| ------------ | ------------------------ | -------- | ------- |
| `url`        | Target URL to package    | ✅       |         |
| `name`       | Application name         | ✅       |         |
| `output-dir` | Output directory         |          | `dist`  |
| `icon`       | Custom app icon URL/path |          |         |
| `width`      | Window width             |          | `1200`  |
| `height`     | Window height            |          | `780`   |
| `debug`      | Enable debug mode        |          | `false` |

## Outputs

| Output         | Description                   |
| -------------- | ----------------------------- |
| `package-path` | Path to the generated package |

## Examples

### Basic Usage

```yaml
name: Build Web App
on: [push]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: davidscottpope-gif/Pake@feature/macos-only-ts-js-cleanup
        with:
          url: "https://weekly.tw93.fun"
          name: "WeeklyApp"
```

### With Custom Icon

```yaml
- uses: davidscottpope-gif/Pake@feature/macos-only-ts-js-cleanup
  with:
    url: "https://example.com"
    name: "MyApp"
    icon: "https://example.com/icon.png"
    width: 1400
    height: 900
```

## How It Works

1. **Auto Setup**: Installs Rust, Node.js dependencies, builds Pake CLI
2. **Build App**: Runs `pake` command with your parameters
3. **Package Output**: Finds and moves the generated package to output directory

## Supported Platforms

- **macOS**: `.app` bundle (macOS runners)

Each run moves only the first package it finds into the output directory and reports it as `package-path`.

## Related Documentation

- [GitHub Actions Usage](github-actions-usage.md) - Using Pake's built-in workflow
- [CLI Usage](cli-usage.md) - Command-line interface reference
- [Advanced Usage](advanced-usage.md) - Customization options

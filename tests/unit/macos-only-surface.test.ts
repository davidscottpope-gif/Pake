import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), 'utf8');
describe('Mac-only supported surface', () => {
  it('ships the Mac-only CLI and template', () => {
    expect(JSON.parse(read('package.json')).os).toEqual(['darwin']);
    const config = JSON.parse(read('src-tauri/pake.json'));
    expect(Object.keys(config.user_agent)).toEqual(['macos']);
    expect(Object.keys(config.system_tray)).toEqual(['macos']);
    expect(config.windows.length).toBeGreaterThan(0);
    for (const file of [
      'src-tauri/tauri.linux.conf.json',
      'src-tauri/tauri.windows.conf.json',
      'src-tauri/assets/main.wxs',
      'Dockerfile',
    ]) {
      expect(fs.existsSync(file), file).toBe(false);
    }
    expect(read('src-tauri/Cargo.toml')).not.toMatch(
      /webkit2gtk|webview2-com|windows-sys|windows-core|image-ico/,
    );
    expect(read('src-tauri/src/lib.rs')).toContain(
      'compile_error!("This Pake fork supports macOS only.")',
    );
  });
  it('keeps build workflows Mac-only without broken platform matrix references', () => {
    for (const file of [
      'pake-cli.yaml',
      'quality-and-test.yml',
      'release.yml',
      'single-app.yaml',
      'npm-publish.yml',
    ]) {
      const source = read(`.github/workflows/${file}`);
      expect(source, file).not.toMatch(
        /ubuntu-|windows-latest|linux\/amd64|matrix\.(?:os|build)|publish-docker/,
      );
      expect(source, file).toContain('macos-latest');
    }
    expect(read('action.yml')).toContain('PACKAGE_EXTS=(app dmg)');
    expect(read('.github/workflows/single-app.yaml')).toContain(
      '--targets dmg --multi-arch',
    );
    expect(read('.github/workflows/pake-cli.yaml')).toContain(
      'INPUT_URL: ${{ inputs.url }}',
    );
    expect(read('.github/workflows/pake-cli.yaml')).not.toMatch(
      /ARGS=.*\$\{\{ inputs/,
    );
  });
  it('leaves contributor automation enabled', () => {
    expect(read('.github/workflows/update-contributors.yml')).toContain(
      'schedule:',
    );
  });
});

describe('unsupported build hosts', () => {
  it('rejects before workspace setup and icon processing', () => {
    const source = read('bin/cli.ts');
    const guard = source.indexOf("process.platform !== 'darwin'");
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(source.indexOf('restoreLocalTree();'));
    expect(guard).toBeLessThan(
      source.indexOf('const workspace = await enterBuildWorkspace();'),
    );
    expect(guard).toBeLessThan(
      source.indexOf('await handleInputOptions(options, url)'),
    );
  });
});

describe('fork example and package test provenance', () => {
  it('tests the local packed fork rather than upstream npm', () => {
    const source = read('tests/index.js');
    expect(source).toContain('npm pack --json --ignore-scripts');
    expect(source).toContain('node_modules/pake-cli/dist/cli.js');
    expect(source).not.toContain('pake-cli@latest');
    expect(source).not.toContain('npx pake --version');
  });
});

describe('Mac notification window reveal', () => {
  it('preserves reveal/focus/click without the removed Windows taskbar helper', () => {
    const source = read('src-tauri/src/app/notification.rs');
    expect(source).not.toContain('reapply_window_icon');
    expect(source).toContain('window.unminimize()');
    expect(source).toContain('window.show()');
    expect(source).toContain('window.set_focus()');
    expect(source).toContain('window.__pakeNotificationClick');
  });
});

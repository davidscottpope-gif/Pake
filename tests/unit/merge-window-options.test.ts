import { describe, expect, it } from 'vitest';
import { buildWindowConfigOverrides } from '../../bin/helpers/merge';
import { DEFAULT_PAKE_OPTIONS } from '../../bin/defaults';
import type { PakeAppOptions } from '../../bin/types';

function makeOptions(overrides: Partial<PakeAppOptions> = {}): PakeAppOptions {
  return {
    ...DEFAULT_PAKE_OPTIONS,
    identifier: 'com.pake.test',
    ...overrides,
  };
}

describe('buildWindowConfigOverrides', () => {
  it('disables URL restoration without enabling private mode', () => {
    expect(
      buildWindowConfigOverrides(makeOptions({ restoreLastUrl: false })),
    ).toMatchObject({ restore_last_url: false, incognito: false });
  });

  it('matches the default snapshot on macOS', () => {
    const result = buildWindowConfigOverrides(makeOptions());
    expect(result).toMatchSnapshot();
  });

  it('respects explicit hideOnClose=false on macOS', () => {
    const result = buildWindowConfigOverrides(
      makeOptions({ hideOnClose: false }),
    );
    expect(result.hide_on_close).toBe(false);
  });

  it('defaults hideOnClose to true on macOS when undefined', () => {
    const result = buildWindowConfigOverrides(
      makeOptions({ hideOnClose: undefined }),
    );
    expect(result.hide_on_close).toBe(true);
  });

  it('forwards hideTitleBar', () => {
    expect(
      buildWindowConfigOverrides({ ...makeOptions(), hideTitleBar: true })
        .hide_title_bar,
    ).toBe(true);
  });

  it('drops unsupported platform-only config keys', () => {
    const result = buildWindowConfigOverrides(makeOptions());
    expect(result).not.toHaveProperty('hide_window_decorations');
    expect(result).not.toHaveProperty('password_autosave');
  });

  it('only enables start_to_tray when both flag and tray are on', () => {
    expect(
      buildWindowConfigOverrides(
        makeOptions({ startToTray: true, showSystemTray: false }),
      ).start_to_tray,
    ).toBe(false);
    expect(
      buildWindowConfigOverrides(
        makeOptions({ startToTray: true, showSystemTray: true }),
      ).start_to_tray,
    ).toBe(true);
  });

  it('forwards window/zoom/wasm/new_window flags verbatim', () => {
    const result = buildWindowConfigOverrides(
      makeOptions({
        width: 1400,
        height: 900,
        zoom: 120,
        minWidth: 800,
        minHeight: 600,
        wasm: true,
        enableDragDrop: true,
        ignoreCertificateErrors: true,
        newWindow: true,
        enableFind: true,
        forceInternalNavigation: true,
        internalUrlRegex: '^https://example\\.com',
      }),
    );
    expect(result).toMatchObject({
      width: 1400,
      height: 900,
      zoom: 120,
      min_width: 800,
      min_height: 600,
      enable_wasm: true,
      enable_drag_drop: true,
      ignore_certificate_errors: true,
      new_window: true,
      enable_find: true,
      force_internal_navigation: true,
      internal_url_regex: '^https://example\\.com',
    });
  });
});

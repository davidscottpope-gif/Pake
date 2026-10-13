import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/dir', () => ({
  npmDirectory: process.cwd(),
  tauriConfigDirectory: path.join(process.cwd(), 'src-tauri', '.pake'),
}));

import MacBuilder from '@/builders/MacBuilder';
import type { PakeAppOptions } from '@/types';

// Expose the builder's command/path calculations without running a build.
class InspectableMacBuilder extends MacBuilder {
  command(packageManager: string) {
    return this.getBuildCommand(packageManager);
  }

  bundlePath() {
    return this.getBasePath();
  }

  binarySourcePath() {
    return this.getRawBinarySourcePath(process.cwd(), 'Demo');
  }

  protected getMacOSMajorVersion() {
    return 23;
  }
}

const makeBuilder = (options: Partial<PakeAppOptions> = {}) =>
  new InspectableMacBuilder({
    name: 'Demo',
    appVersion: '1.2.3',
    ...options,
  } as PakeAppOptions);

const nativeTargets = {
  arm64: { suffix: 'aarch64', target: 'aarch64-apple-darwin' },
  x64: { suffix: 'x64', target: 'x86_64-apple-darwin' },
};

describe('MacBuilder architecture resolution', () => {
  beforeEach(() => {
    vi.stubEnv('PAKE_CREATE_APP', '');
    vi.stubEnv('CARGO_TARGET_DIR', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe.each(['arm64', 'x64'] as const)('on a %s host', (hostArch) => {
    beforeEach(() => {
      vi.spyOn(process, 'arch', 'get').mockReturnValue(hostArch);
    });

    const native = nativeTargets[hostArch];
    const cases = [
      { input: undefined, arch: hostArch, ...native },
      { input: 'auto', arch: hostArch, ...native },
      { input: 'app', arch: hostArch, ...native },
      { input: 'dmg', arch: hostArch, ...native },
      { input: 'apple', arch: 'arm64', ...nativeTargets.arm64 },
      { input: 'arm64', arch: 'arm64', ...nativeTargets.arm64 },
      { input: 'intel', arch: 'x64', ...nativeTargets.x64 },
      { input: 'x64', arch: 'x64', ...nativeTargets.x64 },
      {
        input: 'universal',
        arch: 'universal',
        suffix: 'universal',
        target: 'universal-apple-darwin',
      },
    ];

    it.each(cases)('keeps names, report arch and target for $input', (row) => {
      const builder = makeBuilder({ targets: row.input });
      expect(builder.getFileName()).toBe(
        row.input === 'app' ? 'Demo' : `Demo_1.2.3_${row.suffix}`,
      );
      expect(builder.getReportArch()).toBe(row.arch);
      expect(builder.command('pnpm')).toEqual({
        executable: 'pnpm',
        args: [
          'run',
          'build',
          '-c',
          path.join('src-tauri', '.pake', 'tauri.conf.json'),
          '--target',
          row.target,
          '--features',
          'cli-build,macos-proxy',
        ],
      });
      expect(builder.bundlePath()).toBe(
        path.join('src-tauri', 'target', row.target, 'release', 'bundle'),
      );
    });

    it.each(cases)('lets multiArch override $input', (row) => {
      const builder = makeBuilder({ targets: row.input, multiArch: true });
      expect(builder.getReportArch()).toBe('universal');
      expect(builder.getFileName()).toBe(
        row.input === 'app' ? 'Demo' : 'Demo_1.2.3_universal',
      );
      expect(builder.command('pnpm').args).toContain('universal-apple-darwin');
      expect(builder.bundlePath()).toBe(
        path.join(
          'src-tauri',
          'target',
          'universal-apple-darwin',
          'release',
          'bundle',
        ),
      );
    });
  });

  it.each([{ iterativeBuild: true }, { install: true }, { targets: 'app' }])(
    'keeps app output for %j',
    (options) => {
      expect(makeBuilder(options).getFileName()).toBe('Demo');
    },
  );

  it('keeps app output when PAKE_CREATE_APP=1', () => {
    vi.stubEnv('PAKE_CREATE_APP', '1');
    expect(makeBuilder({ targets: 'apple' }).getFileName()).toBe('Demo');
  });

  it.each(['npm', 'pnpm'])('keeps debug command arguments for %s', (pm) => {
    const command = makeBuilder({ targets: 'intel', debug: true }).command(pm);
    expect(command).toEqual({
      executable: pm,
      args: [
        'run',
        'build:debug',
        ...(pm === 'npm' ? ['--'] : []),
        '-c',
        path.join('src-tauri', '.pake', 'tauri.conf.json'),
        '--target',
        'x86_64-apple-darwin',
        '--verbose',
        '--features',
        'cli-build,macos-proxy',
      ],
    });
  });

  it.each([
    { root: '.cargo-output', debug: false },
    { root: '.cargo-output', debug: true },
    { root: path.join(process.cwd(), '.cargo-output'), debug: false },
    { root: path.join(process.cwd(), '.cargo-output'), debug: true },
  ])('keeps bundle and raw binary paths for %j', ({ root, debug }) => {
    vi.stubEnv('CARGO_TARGET_DIR', root);
    const builder = makeBuilder({ targets: 'apple', debug });
    const mode = debug ? 'debug' : 'release';
    expect(builder.bundlePath()).toBe(
      path.join(root, 'aarch64-apple-darwin', mode, 'bundle'),
    );
    expect(builder.binarySourcePath()).toBe(
      path.join(
        path.isAbsolute(root) ? root : path.join(process.cwd(), root),
        'aarch64-apple-darwin',
        mode,
        'pake-demo',
      ),
    );
  });

  it('keeps rejecting an unsupported native architecture at each target consumer', () => {
    vi.spyOn(process, 'arch', 'get').mockReturnValue('riscv64');
    const builder = makeBuilder({ targets: 'auto' });
    expect(builder.getReportArch()).toBe('riscv64');
    expect(builder.getFileName()).toBe('Demo_1.2.3_riscv64');
    const message = 'Unsupported architecture: riscv64 for macOS';
    expect(() => builder.command('pnpm')).toThrow(message);
    expect(() => builder.bundlePath()).toThrow(message);
    expect(() => builder.binarySourcePath()).toThrow(message);
  });
});

import path from 'path';
import { PakeAppOptions } from '@/types';
import BaseBuilder from './BaseBuilder';
import type { ShellCommand } from '@/utils/shell';

export default class MacBuilder extends BaseBuilder {
  private buildFormat: string;
  private buildArch: string;

  constructor(options: PakeAppOptions) {
    super(options);

    const validArchs = ['intel', 'apple', 'universal', 'auto', 'x64', 'arm64'];
    this.buildArch = validArchs.includes(options.targets || '')
      ? options.targets
      : 'auto';

    // `app` is a valid macOS bundle target (see merge.ts); honour it explicitly.
    if (
      options.targets === 'app' ||
      options.iterativeBuild ||
      options.install ||
      process.env.PAKE_CREATE_APP === '1'
    ) {
      this.buildFormat = 'app';
    } else {
      this.buildFormat = 'dmg';
    }

    this.options.targets = this.buildFormat;
  }

  getFileName(): string {
    const { name = 'pake-app' } = this.options;

    if (this.buildFormat === 'app') {
      return name;
    }

    const arch = this.getArchDisplayName(this.getActualArch());
    return `${name}_${this.options.appVersion}_${arch}`;
  }

  getReportArch(): string {
    return this.getActualArch();
  }

  private getActualArch(): string {
    if (this.buildArch === 'universal' || this.options.multiArch) {
      return 'universal';
    } else if (this.buildArch === 'apple') {
      return 'arm64';
    } else if (this.buildArch === 'intel') {
      return 'x64';
    }
    return this.resolveTargetArch(this.buildArch);
  }

  protected getBuildCommand(packageManager: string = 'pnpm'): ShellCommand {
    const configPath = path.join('src-tauri', '.pake', 'tauri.conf.json');
    return this.buildBaseCommand(
      packageManager,
      configPath,
      this.getMacOSTarget(),
    );
  }

  protected getBasePath(): string {
    const basePath = this.options.debug ? 'debug' : 'release';
    return path.join(this.getArchSpecificPath(), basePath, 'bundle');
  }

  protected getArchSpecificPath(): string {
    return path.join(this.getCargoTargetDir(), this.getMacOSTarget());
  }

  private getMacOSTarget(): string {
    const actualArch = this.getActualArch();
    const target = this.getTauriTarget(actualArch, 'darwin');
    if (!target) {
      throw new Error(`Unsupported architecture: ${actualArch} for macOS`);
    }
    return target;
  }
}

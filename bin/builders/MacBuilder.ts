import path from 'path';
import fsExtra from 'fs-extra';
import chalk from 'chalk';
import prompts from 'prompts';

import { PakeAppOptions } from '@/types';
import { checkRustInstalled, ensureRustEnv, installRust } from '@/helpers/rust';
import { mergeConfig } from '@/helpers/merge';
import tauriConfig from '@/helpers/tauriConfig';
import { generateIdentifierSafeName } from '@/utils/name';
import { npmDirectory, packageDirectory } from '@/utils/dir';
import { PakeError } from '@/utils/error';
import { getSpinner } from '@/utils/info';
import { BuildArtifact, isInteractive } from '@/utils/output';
import { shellExec, type ShellCommand } from '@/utils/shell';
import { hasReadyTauriCli } from '@/utils/tauri-cli';
import { CN_MIRROR_ENV, isCnMirrorEnabled } from '@/utils/mirror';
import logger from '@/options/logger';
import {
  configureCargoRegistry,
  detectPackageManager,
  getBuildEnvironment,
  getBuildTimeout,
  getInstallCommand,
  getInstallTimeout,
} from './env';
export default class MacBuilder {
  protected options: PakeAppOptions;
  private artifacts: BuildArtifact[] = [];

  private buildFormat: string;
  private buildArch: string;

  constructor(options: PakeAppOptions) {
    this.options = options;

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

  /** Final artifacts produced by this build, for the `--json` result. */
  getArtifacts(): BuildArtifact[] {
    return [...this.artifacts];
  }

  /** Architecture reported in the `--json` result. */
  getReportArch(): string {
    return this.getActualArch();
  }

  protected async recordArtifact(
    artifactPath: string,
    format: string,
  ): Promise<void> {
    try {
      const stat = await fsExtra.stat(artifactPath);
      let sizeBytes = stat.size;
      if (stat.isDirectory()) {
        sizeBytes = await MacBuilder.getPathSize(artifactPath);
      }
      this.artifacts.push({
        path: path.resolve(artifactPath),
        sizeBytes,
        format,
      });
    } catch {
      // Never fail a finished build over size bookkeeping.
      this.artifacts.push({
        path: path.resolve(artifactPath),
        sizeBytes: 0,
        format,
      });
    }
  }

  private static async getPathSize(directory: string): Promise<number> {
    let size = 0;
    for (const entry of await fsExtra.readdir(directory, {
      withFileTypes: true,
    })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        size += await MacBuilder.getPathSize(entryPath);
      } else if (entry.isFile()) {
        size += (await fsExtra.stat(entryPath)).size;
      }
    }
    return size;
  }

  async prepare() {
    const tauriSrcPath = path.join(npmDirectory, 'src-tauri');
    const tauriTargetPath = this.getCargoTargetDir();
    const tauriTargetPathExists = await fsExtra.pathExists(tauriTargetPath);

    ensureRustEnv();

    if (!checkRustInstalled()) {
      if (!isInteractive()) {
        throw new PakeError('Rust required to package your webapp.', {
          code: 'ENV_MISSING',
          hint: 'Install Rust via https://rustup.rs, then rerun the same command.',
        });
      }

      const res = await prompts({
        type: 'confirm',
        message: 'Rust not detected. Install now?',
        name: 'value',
      });

      if (res.value) {
        await installRust();
      } else {
        throw new PakeError('Rust required to package your webapp.', {
          code: 'ENV_MISSING',
          hint: 'Install Rust via https://rustup.rs, then rerun the same command.',
        });
      }
    }

    const useCnMirror = isCnMirrorEnabled();
    await configureCargoRegistry(tauriSrcPath, useCnMirror);

    // Workspaces reuse installed dependencies. Reinstalling through their
    // node_modules link would mutate the shared CLI installation.
    if (await hasReadyTauriCli(npmDirectory)) {
      return;
    }

    // Dependencies may disappear after the workspace linked them. Reinstall
    // privately even in that case, without writing through to the source tree.
    const modules = path.join(npmDirectory, 'node_modules');
    if (
      npmDirectory !== packageDirectory &&
      (await fsExtra.lstat(modules).catch(() => null))?.isSymbolicLink()
    ) {
      await fsExtra.unlink(modules);
    }

    const spinner = getSpinner('Installing package...');
    const packageManager = await detectPackageManager();
    const timeout = getInstallTimeout();
    const buildEnv = getBuildEnvironment();

    // Show helpful message for first-time users
    if (!tauriTargetPathExists) {
      logger.info(
        '✺ First-time setup may take 5-10 minutes (installing dependencies)...',
      );
    }

    if (useCnMirror) {
      logger.info(
        `✺ ${CN_MIRROR_ENV}=1 detected, using ${packageManager}/rsProxy CN mirror.`,
      );
    }

    try {
      await shellExec(getInstallCommand(packageManager, useCnMirror), timeout, {
        ...buildEnv,
        CI: 'true',
      });
      spinner.succeed(chalk.green('Package installed!'));
    } catch (error) {
      spinner.fail(chalk.red('Installation failed'));
      if (!useCnMirror) {
        logger.info(
          `✺ If downloads are slow in China, retry with ${CN_MIRROR_ENV}=1 to use CN mirrors.`,
        );
      }
      throw error;
    }

    if (!tauriTargetPathExists) {
      logger.warn(
        '✼ The first packaging may be slow, please be patient and wait, it will be faster afterwards.',
      );
    }
  }

  async build(url: string) {
    await this.buildAndCopy(url, this.options.targets);
  }

  async start(url: string) {
    logger.info('Pake dev server starting...');
    await mergeConfig(url, this.options, structuredClone(tauriConfig));

    const packageManager = await detectPackageManager();
    const configPath = path.join(
      npmDirectory,
      'src-tauri',
      '.pake',
      'tauri.conf.json',
    );

    const features = this.getBuildFeatures();
    const args = ['run', 'tauri'];
    if (packageManager === 'npm') args.push('--');
    args.push('dev', '--config', configPath);
    if (features.length > 0) args.push('--features', features.join(','));

    await shellExec({ executable: packageManager, args });
  }

  async buildAndCopy(url: string, target: string, logSuccess = true) {
    await this.prepareBuild(url);
    await this.runBuildCommand(
      this.getBuildCommand(await detectPackageManager()),
      target,
    );
    await this.copyBuildArtifacts(target, logSuccess);
  }

  protected async prepareBuild(url: string) {
    await mergeConfig(url, this.options, structuredClone(tauriConfig));
  }

  protected async runBuildCommand(buildCommand: ShellCommand, target: string) {
    // Build app
    const buildSpinner = getSpinner('Building app...');
    buildSpinner.stop();
    // Show static message to keep the status visible. Info, not warn: warn
    // entries feed the --json warnings array and this is a status line.
    logger.info('✸ Building app...');

    const baseEnv = getBuildEnvironment();
    await shellExec(buildCommand, getBuildTimeout(), baseEnv);
  }

  protected async copyBuildArtifacts(target: string, logSuccess = true) {
    const { name = 'pake-app' } = this.options;
    // Copy app
    const fileName = this.getFileName();
    const fileType = this.getFileType(target);
    const appPath = this.getBuildAppPath(npmDirectory, fileName, fileType);
    const distPath = path.resolve(`${name}.${fileType}`);
    await fsExtra.copy(appPath, distPath);
    await this.recordArtifact(distPath, fileType);

    // Copy raw binary if requested
    if (this.options.keepBinary) {
      await this.copyRawBinary(npmDirectory, name);
      await this.recordArtifact(this.getRawBinaryPath(name), 'binary');
    }

    await fsExtra.remove(appPath);
    if (logSuccess) {
      logger.success('✔ Build success!');
      logger.success('✔ App installer located in', distPath);
    }

    // Log binary location if preserved
    if (this.options.keepBinary) {
      const binaryPath = this.getRawBinaryPath(name);
      logger.success('✔ Raw binary located in', path.resolve(binaryPath));
    }

    if (fileType === 'app' && this.options.install) {
      await this.installAppToApplications(distPath, name);
    }
  }

  private async installAppToApplications(
    appBundlePath: string,
    appName: string,
  ): Promise<void> {
    try {
      logger.info(`- Installing ${appName} to /Applications...`);

      const appBundleName = path.basename(appBundlePath);
      const appDest = path.join('/Applications', appBundleName);

      if (await fsExtra.pathExists(appDest)) {
        logger.warn(
          `  Existing ${appBundleName} in /Applications will be replaced.`,
        );
      }

      // fsExtra.move uses fs.rename (atomic on same filesystem) and falls back
      // to copy+remove only when moving across volumes.
      await fsExtra.move(appBundlePath, appDest, { overwrite: true });

      // Keep the JSON result pointing at where the artifact actually lives.
      const movedFrom = path.resolve(appBundlePath);
      for (const artifact of this.artifacts) {
        if (artifact.path === movedFrom) {
          artifact.path = appDest;
        }
      }

      logger.success(
        `✔ ${appBundleName.replace(/\.app$/, '')} installed to /Applications`,
      );
    } catch (error) {
      logger.error(`✕ Failed to install ${appName}: ${error}`);
      logger.info(`  App bundle still available at: ${appBundlePath}`);
    }
  }

  protected getFileType(target: string): string {
    return target;
  }

  getFileName(): string {
    const { name = 'pake-app' } = this.options;

    if (this.buildFormat === 'app') {
      return name;
    }

    const arch = this.getArchDisplayName(this.getActualArch());
    return `${name}_${this.options.appVersion}_${arch}`;
  }

  protected static readonly ARCH_MAPPINGS: Record<
    string,
    Record<string, string>
  > = {
    darwin: {
      arm64: 'aarch64-apple-darwin',
      x64: 'x86_64-apple-darwin',
      universal: 'universal-apple-darwin',
    },
  };

  protected static readonly ARCH_DISPLAY_NAMES: Record<string, string> = {
    arm64: 'aarch64',
    x64: 'x64',
    universal: 'universal',
  };

  protected resolveTargetArch(requestedArch?: string): string {
    if (requestedArch === 'auto' || !requestedArch) {
      return process.arch;
    }
    return requestedArch;
  }

  protected getTauriTarget(
    arch: string,
    platform: NodeJS.Platform = process.platform,
  ): string | null {
    const platformMappings = MacBuilder.ARCH_MAPPINGS[platform];
    if (!platformMappings) return null;
    return platformMappings[arch] || null;
  }

  protected getArchDisplayName(arch: string): string {
    return MacBuilder.ARCH_DISPLAY_NAMES[arch] || arch;
  }

  protected buildBaseCommand(
    packageManager: string,
    configPath: string,
    target?: string,
  ): ShellCommand {
    const args = ['run', this.options.debug ? 'build:debug' : 'build'];
    if (packageManager === 'npm') args.push('--');
    args.push('-c', configPath);

    if (target) {
      args.push('--target', target);
    }

    // Enable verbose output in debug mode to help diagnose build issues.
    // This provides detailed logs from Tauri CLI and bundler tools.
    if (this.options.debug) {
      args.push('--verbose');
    }

    const features = this.getBuildFeatures();
    if (features.length > 0) {
      args.push('--features', features.join(','));
    }

    return { executable: packageManager, args };
  }

  protected getBuildFeatures(): string[] {
    const features = ['cli-build'];

    // Add macos-proxy feature for modern macOS (Darwin 23+ = macOS 14+)
    if (this.getMacOSMajorVersion() >= 23) {
      features.push('macos-proxy');
    }

    return features;
  }

  protected getBuildCommand(packageManager: string = 'pnpm'): ShellCommand {
    const configPath = path.join('src-tauri', '.pake', 'tauri.conf.json');
    return this.buildBaseCommand(
      packageManager,
      configPath,
      this.getMacOSTarget(),
    );
  }

  protected getMacOSMajorVersion(): number {
    try {
      const os = require('os');
      const release = os.release();
      const majorVersion = parseInt(release.split('.')[0], 10);
      return majorVersion;
    } catch (error) {
      return 0; // Disable proxy feature if version detection fails
    }
  }

  protected getCargoTargetDir(): string {
    return process.env.CARGO_TARGET_DIR || path.join('src-tauri', 'target');
  }

  protected resolveBuildPath(npmDirectory: string, buildPath: string): string {
    return path.isAbsolute(buildPath)
      ? buildPath
      : path.join(npmDirectory, buildPath);
  }

  protected getBasePath(): string {
    const basePath = this.options.debug ? 'debug' : 'release';
    return path.join(this.getArchSpecificPath(), basePath, 'bundle');
  }

  protected getBuildAppPath(
    npmDirectory: string,
    fileName: string,
    fileType: string,
  ): string {
    // For app bundles on macOS, the directory is 'macos', not 'app'
    const bundleDir =
      fileType.toLowerCase() === 'app' ? 'macos' : fileType.toLowerCase();
    return path.join(
      this.resolveBuildPath(npmDirectory, this.getBasePath()),
      bundleDir,
      `${fileName}.${fileType}`,
    );
  }

  /**
   * Copy raw binary file to output directory
   */
  protected async copyRawBinary(
    npmDirectory: string,
    appName: string,
  ): Promise<void> {
    const binaryPath = this.getRawBinarySourcePath(npmDirectory, appName);
    const outputPath = this.getRawBinaryPath(appName);

    if (await fsExtra.pathExists(binaryPath)) {
      await fsExtra.copy(binaryPath, outputPath);
      await fsExtra.chmod(outputPath, 0o755);
    } else {
      logger.warn(`✼ Raw binary not found at ${binaryPath}, skipping...`);
    }
  }

  /**
   * Get the source path of the raw binary file in the build directory
   */
  protected getRawBinarySourcePath(
    npmDirectory: string,
    appName: string,
  ): string {
    const basePath = this.options.debug ? 'debug' : 'release';
    const binaryName = this.getBinaryName(appName);

    return path.join(
      this.resolveBuildPath(npmDirectory, this.getArchSpecificPath()),
      basePath,
      binaryName,
    );
  }

  /**
   * Get the output path for the raw binary file
   */
  protected getRawBinaryPath(appName: string): string {
    return `${appName}-binary`;
  }

  /**
   * Get the binary name based on app name and platform
   */
  protected getBinaryName(appName: string): string {
    return `pake-${generateIdentifierSafeName(appName)}`;
  }

  /** Directory containing this architecture's debug/release outputs. */
  protected getArchSpecificPath(): string {
    return path.join(this.getCargoTargetDir(), this.getMacOSTarget());
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

  private getMacOSTarget(): string {
    const actualArch = this.getActualArch();
    const target = this.getTauriTarget(actualArch, 'darwin');
    if (!target) {
      throw new Error(`Unsupported architecture: ${actualArch} for macOS`);
    }
    return target;
  }
}

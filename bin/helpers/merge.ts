import path from 'path';
import fsExtra from 'fs-extra';

import combineFiles from '@/utils/combine';
import logger from '@/options/logger';
import {
  generateSafeFilename,
  generateIdentifierSafeName,
  getSafeAppName,
} from '@/utils/name';
import { PakeAppOptions, PakeTauriConfig, WindowConfig } from '@/types';
import {
  tauriConfigDirectory,
  npmDirectory,
  packageDirectory,
} from '@/utils/dir';
import { PakeError } from '@/utils/error';

/**
 * Pure transform from CLI options to the window-config slice that gets
 * merged into pake.json. Exposed for snapshot testing so option drift
 * (e.g. a new flag added in cli-program.ts but forgotten here) is caught.
 *
 * Keep this function side-effect free.
 */
export function buildWindowConfigOverrides(
  options: PakeAppOptions,
): Partial<WindowConfig> {
  return {
    width: options.width,
    height: options.height,
    fullscreen: options.fullscreen,
    maximize: options.maximize,
    resizable: options.resizable ?? true,
    hide_title_bar: options.hideTitleBar,
    activation_shortcut: options.activationShortcut,
    always_on_top: options.alwaysOnTop,
    dark_mode: options.darkMode,
    disabled_web_shortcuts: options.disabledWebShortcuts,
    hide_on_close: options.hideOnClose ?? true,
    incognito: options.incognito,
    restore_last_url: options.restoreLastUrl,
    title: options.title,
    enable_wasm: options.wasm,
    enable_drag_drop: options.enableDragDrop,
    start_to_tray: options.startToTray && options.showSystemTray,
    force_internal_navigation: options.forceInternalNavigation,
    internal_url_regex: options.internalUrlRegex,
    enable_find: options.enableFind,
    zoom: options.zoom,
    min_width: options.minWidth,
    min_height: options.minHeight,
    ignore_certificate_errors: options.ignoreCertificateErrors,
    new_window: options.newWindow,
  };
}

async function copyTemplateConfigs(): Promise<void> {
  const srcTauriDir = path.join(npmDirectory, 'src-tauri');
  await fsExtra.ensureDir(tauriConfigDirectory);

  const sourceFiles = ['tauri.conf.json', 'tauri.macos.conf.json', 'pake.json'];

  await Promise.all(
    sourceFiles.map(async (file) => {
      const sourcePath = path.join(srcTauriDir, file);
      const destPath = path.join(tauriConfigDirectory, file);
      if (
        (await fsExtra.pathExists(sourcePath)) &&
        !(await fsExtra.pathExists(destPath))
      ) {
        await fsExtra.copy(sourcePath, destPath);
      }
    }),
  );
}

// Replace the CLI's own dist/ with the user's static files while keeping the
// build artifacts (cli.js) the packaged app does not need but the CLI does.
// dist_bak always holds the ORIGINAL package dist: once it exists, later
// stagings must not overwrite it with a previous user tree, or the original
// files would be unrecoverable across repeated local builds.
async function stageLocalTree(sourceDir: string): Promise<void> {
  const distDir = path.join(npmDirectory, 'dist');
  const distBakDir = path.join(npmDirectory, 'dist_bak');

  // Resolve symlinked input up front: staging must produce a real copy, or
  // the cli.js copy-back below would write through the link into the user's
  // own directory.
  const resolvedSource = await fsExtra.realpath(sourceDir);
  const resolvedPackage = await fsExtra
    .realpath(npmDirectory)
    .catch(() => path.resolve(npmDirectory));
  const installedPackage = await fsExtra.realpath(packageDirectory);
  const packageDist = path.join(resolvedPackage, 'dist');
  if (
    resolvedSource === installedPackage ||
    installedPackage.startsWith(resolvedSource + path.sep) ||
    resolvedSource === resolvedPackage ||
    resolvedPackage.startsWith(resolvedSource + path.sep) ||
    resolvedSource === packageDist ||
    resolvedSource.startsWith(packageDist + path.sep)
  ) {
    throw new PakeError(
      `Local input "${sourceDir}" contains the Pake CLI installation itself.`,
      {
        code: 'INVALID_INPUT',
        hint: 'Point Pake at your built output directory, not at a directory containing pake-cli.',
      },
    );
  }

  try {
    if (await fsExtra.pathExists(distBakDir)) {
      fsExtra.removeSync(distDir);
    } else {
      fsExtra.moveSync(distDir, distBakDir);
    }
    fsExtra.copySync(resolvedSource, distDir, {
      overwrite: true,
      dereference: true,
    });

    const filesToCopyBack = ['cli.js'];
    await Promise.all(
      filesToCopyBack.map((file) =>
        fsExtra.copy(path.join(distBakDir, file), path.join(distDir, file)),
      ),
    );
  } catch (error) {
    // Never leave the package without its own dist/: cli.js lives there and
    // every later `pake` invocation would fail until a manual reinstall.
    restoreLocalTree();
    throw error;
  }
}

// Put the package's original dist/ back once a local-input run is over (or
// failed). Tauri bakes `frontendDist: ../dist` into every binary, so a stale
// staged tree would leak this user's files into the next app built from the
// same install. Safe to call on any run: a present dist_bak always holds the
// original package dist, including one stranded by an older crashed run.
export function restoreLocalTree(): void {
  const distDir = path.join(npmDirectory, 'dist');
  const distBakDir = path.join(npmDirectory, 'dist_bak');
  if (!fsExtra.pathExistsSync(distBakDir)) {
    return;
  }
  try {
    fsExtra.removeSync(distDir);
    fsExtra.moveSync(distBakDir, distDir);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logger.warn(
      `Failed to restore the CLI's original dist/ from dist_bak: ${detail}`,
    );
  }
}

// Exported for unit tests (web fallback and directory entry guard).
export async function handleLocalFile(
  url: string,
  useLocalFile: boolean,
  tauriConf: PakeTauriConfig,
): Promise<void> {
  const pathExists = await fsExtra.pathExists(url);
  if (!pathExists) {
    tauriConf.pake.windows[0].url_type = 'web';
    return;
  }

  const stat = await fsExtra.stat(url);

  if (stat.isDirectory()) {
    // A directory of static web assets (e.g. a generated dist/): the whole
    // tree is packaged and the app entry is its root index.html.
    const entryFile = 'index.html';
    if (!(await fsExtra.pathExists(path.join(url, entryFile)))) {
      throw new PakeError(
        `Local directory "${url}" has no ${entryFile} at its root.`,
        {
          code: 'INVALID_INPUT',
          hint: 'Point Pake at the built output directory that contains index.html.',
        },
      );
    }
    logger.info(`✺ Packaging local directory: ${url}`);
    await stageLocalTree(url);
    tauriConf.pake.windows[0].url = entryFile;
    tauriConf.pake.windows[0].url_type = 'local';
    return;
  }

  logger.info(`✺ Packaging local file: ${url}`);

  const fileName = path.basename(url);
  const distDir = path.join(npmDirectory, 'dist');

  if (!useLocalFile) {
    const urlPath = path.join(distDir, fileName);
    await fsExtra.copy(url, urlPath);
  } else {
    await stageLocalTree(path.dirname(url));
  }

  tauriConf.pake.windows[0].url = fileName;
  tauriConf.pake.windows[0].url_type = 'local';
}

export async function resolveSystemTrayIconPath(
  systemTrayIcon: string,
  defaultTrayIconPath: string,
  safeAppName: string,
  iconOutputDir = path.join(npmDirectory, 'src-tauri/png'),
): Promise<string> {
  if (systemTrayIcon.length === 0) {
    return defaultTrayIconPath;
  }

  try {
    const iconExt = path.extname(systemTrayIcon).toLowerCase();
    if (iconExt !== '.png') {
      logger.warn(
        `✼ System tray icon must be .png, but you provided ${iconExt}.`,
      );
      logger.warn(`✼ Default system tray icon will be used.`);
      return defaultTrayIconPath;
    }

    if (!(await fsExtra.pathExists(systemTrayIcon))) {
      logger.warn(`✼ System tray icon "${systemTrayIcon}" was not found.`);
      logger.warn(`✼ Default system tray icon will be used.`);
      return defaultTrayIconPath;
    }

    const trayIconPath = `png/${safeAppName}${iconExt}`;
    const trayIcoPath = path.join(iconOutputDir, `${safeAppName}${iconExt}`);
    await fsExtra.copy(systemTrayIcon, trayIcoPath);
    return trayIconPath;
  } catch (err) {
    logger.warn(
      `✼ Failed to apply system tray icon "${systemTrayIcon}": ${err instanceof Error ? err.message : String(err)}`,
    );
    logger.warn(`✼ Default system tray icon will remain unchanged.`);
    return defaultTrayIconPath;
  }
}

async function mergeIcons(
  options: PakeAppOptions,
  tauriConf: PakeTauriConfig,
  safeAppName: string,
): Promise<void> {
  const iconInfo = {
    fileExt: '.icns',
    path: `icons/${safeAppName}.icns`,
    defaultIcon: 'icons/icon.icns',
    message: 'macOS icon must be .icns type.',
  };

  const resolvedIconPath = options.icon ? path.resolve(options.icon) : null;
  const exists =
    resolvedIconPath && (await fsExtra.pathExists(resolvedIconPath));

  if (exists) {
    let updateIconPath = true;
    const customIconExt = path.extname(resolvedIconPath).toLowerCase();

    if (customIconExt !== iconInfo.fileExt) {
      updateIconPath = false;
      logger.warn(`✼ ${iconInfo.message}, but you give ${customIconExt}`);
      tauriConf.bundle.icon = [iconInfo.defaultIcon];
    } else {
      const iconPath = path.join(npmDirectory, 'src-tauri/', iconInfo.path);
      tauriConf.bundle.resources = [iconInfo.path];

      const absoluteDestPath = path.resolve(iconPath);
      if (resolvedIconPath !== absoluteDestPath) {
        try {
          await fsExtra.copy(resolvedIconPath, iconPath);
        } catch (error) {
          if (
            !(
              error instanceof Error &&
              error.message.includes(
                'Source and destination must not be the same',
              )
            )
          ) {
            throw error;
          }
        }
      }
    }

    if (updateIconPath) {
      tauriConf.bundle.icon = [iconInfo.path];
    } else {
      logger.warn(`✼ Icon will remain as default.`);
    }
  } else {
    logger.warn(
      '✼ Custom icon path may be invalid, default icon will be used instead.',
    );
    tauriConf.bundle.icon = [iconInfo.defaultIcon];
  }

  // Set tray icon path.
  const defaultTrayIconPath = 'png/icon_512.png';
  const trayIconPath = await resolveSystemTrayIconPath(
    options.systemTrayIcon,
    defaultTrayIconPath,
    safeAppName,
  );

  tauriConf.pake.system_tray_path = trayIconPath;
  delete tauriConf.app.trayIcon;
}

async function injectCustomCode(
  options: PakeAppOptions,
  tauriConf: PakeTauriConfig,
): Promise<void> {
  const { inject, proxyUrl, basicAuth, multiInstance, multiWindow, wasm } =
    options;
  const injectFilePath = path.join(
    npmDirectory,
    'src-tauri/src/inject/custom.js',
  );

  if (inject?.length > 0) {
    const injectArray = Array.isArray(inject) ? inject : [inject];
    if (
      !injectArray.every(
        (item) => item.endsWith('.css') || item.endsWith('.js'),
      )
    ) {
      logger.error('The injected file must be in either CSS or JS format.');
      return;
    }
    const files = injectArray.map((filepath) =>
      path.isAbsolute(filepath) ? filepath : path.join(process.cwd(), filepath),
    );
    tauriConf.pake.inject = files;
    await combineFiles(files, injectFilePath);
  } else {
    tauriConf.pake.inject = [];
    await fsExtra.writeFile(injectFilePath, '');
  }

  tauriConf.pake.proxy_url = proxyUrl || '';
  tauriConf.pake.download_dir = options.downloadDir || '';
  tauriConf.pake.basic_auth = basicAuth;
  tauriConf.pake.multi_instance = multiInstance;
  tauriConf.pake.multi_window = multiWindow;

  if (wasm) {
    tauriConf.app.security = {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    };
  }
}

async function generateMacEntitlements(
  camera: boolean,
  microphone: boolean,
): Promise<void> {
  const entitlementEntries: string[] = [];
  if (camera) {
    entitlementEntries.push(
      '    <key>com.apple.security.device.camera</key>\n    <true/>',
    );
  }
  if (microphone) {
    entitlementEntries.push(
      '    <key>com.apple.security.device.audio-input</key>\n    <true/>',
    );
  }
  const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
${entitlementEntries.join('\n')}
  </dict>
</plist>
`;
  const entitlementsPath = path.join(
    npmDirectory,
    'src-tauri',
    'entitlements.plist',
  );
  await fsExtra.writeFile(entitlementsPath, entitlementsContent);
}

async function writeAllConfigs(tauriConf: PakeTauriConfig): Promise<void> {
  const configPath = path.join(tauriConfigDirectory, 'tauri.macos.conf.json');
  const bundleConf = { bundle: tauriConf.bundle };
  await fsExtra.outputJSON(configPath, bundleConf, { spaces: 4 });

  const pakeConfigPath = path.join(tauriConfigDirectory, 'pake.json');
  await fsExtra.outputJSON(pakeConfigPath, tauriConf.pake, { spaces: 4 });

  const tauriConf2 = JSON.parse(JSON.stringify(tauriConf));
  delete tauriConf2.pake;
  if (process.env.NODE_ENV === 'development') {
    tauriConf2.bundle = bundleConf.bundle;
  }
  const configJsonPath = path.join(tauriConfigDirectory, 'tauri.conf.json');
  await fsExtra.outputJSON(configJsonPath, tauriConf2, { spaces: 4 });
}

export async function mergeConfig(
  url: string,
  options: PakeAppOptions,
  tauriConf: PakeTauriConfig,
) {
  await copyTemplateConfigs();

  const {
    appVersion,
    userAgent,
    showSystemTray,
    useLocalFile,
    identifier,
    name = 'pake-app',
    wasm,
    camera,
    microphone,
  } = options;

  const tauriConfWindowOptions = buildWindowConfigOverrides(options);
  Object.assign(tauriConf.pake.windows[0], { url, ...tauriConfWindowOptions });

  tauriConf.productName = name;
  tauriConf.identifier = identifier;
  tauriConf.version = appVersion;

  tauriConf.mainBinaryName = `pake-${generateIdentifierSafeName(name)}`;

  await handleLocalFile(url, useLocalFile, tauriConf);

  if (userAgent.length > 0) {
    tauriConf.pake.user_agent.macos = userAgent;
  }
  tauriConf.pake.system_tray.macos = showSystemTray;

  if (['app', 'dmg'].includes(options.targets)) {
    tauriConf.bundle.targets = [options.targets];
  }

  const safeAppName = getSafeAppName(name);
  await mergeIcons(options, tauriConf, safeAppName);

  await injectCustomCode(options, tauriConf);

  await generateMacEntitlements(camera, microphone);

  await writeAllConfigs(tauriConf);
}

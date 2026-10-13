import path from 'path';
import fsExtra from 'fs-extra';
import logger from '@/options/logger';

import { handleIcon } from './icon';
import { getDomain, safeDomainsToRegex } from '@/utils/url';
import {
  promptText,
  capitalizeFirstLetter,
  resolveIdentifier,
} from '@/utils/info';
import { PakeError } from '@/utils/error';
import { isInteractive } from '@/utils/output';
import { PakeAppOptions, PakeCliOptions } from '@/types';

function resolveAppName(name: string): string {
  return capitalizeFirstLetter(getDomain(name) || 'pake');
}

export function resolveLocalAppName(filePath: string): string {
  const baseName = path.parse(filePath).name || 'pake-app';
  const normalized = baseName
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff .-]/g, '')
    .replace(/^[ .-]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || 'pake-app';
}

export function isValidName(name: string): boolean {
  const reg = /^[a-zA-Z0-9\u4e00-\u9fff][a-zA-Z0-9\u4e00-\u9fff .-]*$/;
  return !!name && reg.test(name);
}

export default async function handleOptions(
  options: PakeCliOptions,
  url: string,
): Promise<PakeAppOptions> {
  const isActions = process.env.GITHUB_ACTIONS;
  let name = options.name;

  const pathExists = await fsExtra.pathExists(url);
  if (!options.name) {
    const defaultName = pathExists
      ? resolveLocalAppName(url)
      : resolveAppName(url);
    if (isInteractive()) {
      const promptMessage = 'Enter your application name';
      const namePrompt = await promptText(promptMessage, defaultName);
      name = namePrompt?.trim() || defaultName;
    } else {
      name = defaultName;
    }
  }

  if (name && !isValidName(name)) {
    const errorMsg = `✕ Name should only include letters, numbers, dots, dashes, and spaces (not leading dots, dashes, and spaces). Examples: 123pan, 123Pan, Pan123, weread, WeRead, WERead, we-read, We Read, Vectorizer.AI, 123.`;
    if (isActions) {
      logger.error(errorMsg);
      name = resolveAppName(url);
      logger.warn(`✼ Inside github actions, use the default name: ${name}`);
    } else {
      throw new PakeError(errorMsg);
    }
  }

  const resolvedName = name || 'pake-app';

  const appOptions: PakeAppOptions = {
    ...options,
    name: resolvedName,
    identifier: resolveIdentifier(url, options.name, options.identifier),
  };

  // --safe-domain is sugar over --internal-url-regex; an explicit regex wins.
  if (!options.internalUrlRegex && options.safeDomain) {
    appOptions.internalUrlRegex = safeDomainsToRegex(options.safeDomain);
  }

  const iconPath = await handleIcon(appOptions, url);
  appOptions.icon = iconPath || '';

  return appOptions;
}

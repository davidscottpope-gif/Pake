import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const { user_agent: userAgent } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src-tauri', 'pake.json'), 'utf8'),
);

describe('default macOS user agent', () => {
  it('claims the WebKit engine it runs on', () => {
    expect(Object.keys(userAgent)).toEqual(['macos']);
    expect(userAgent.macos).toMatch(
      /AppleWebKit\/605\.1\.15 .*Safari\/605\.1\.15$/,
    );
    expect(userAgent.macos).not.toContain('Chrome/');
  });
});

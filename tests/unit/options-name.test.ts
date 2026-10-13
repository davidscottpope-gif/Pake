import { describe, expect, it } from 'vitest';
import { isValidName, resolveLocalAppName } from '@/options/index';

describe('option name validation', () => {
  it('allows dots inside app names', () => {
    expect(isValidName('Vectorizer.AI')).toBe(true);
  });

  it('rejects leading dots, dashes, and spaces', () => {
    expect(isValidName('.hidden')).toBe(false);
    expect(isValidName('-hidden')).toBe(false);
    expect(isValidName(' Hidden')).toBe(false);
  });
});

describe('local app name resolution', () => {
  it('preserves dots in local file names', () => {
    expect(resolveLocalAppName('/tmp/Vectorizer.AI.html')).toBe(
      'Vectorizer.AI',
    );
  });

  it('normalizes leading dots from local file names', () => {
    expect(resolveLocalAppName('/tmp/.hidden.html')).toBe('hidden');
  });
});

import { describe, expect, it } from 'vitest';
import { aiLanguageFor } from './ai-client';
import { normalizeCV } from './cv/normalize';

const withSettings = (settings: Record<string, unknown>) => normalizeCV({ personalInfo: { fullName: 'A' }, settings });

describe('aiLanguageFor', () => {
  it('follows the CV language first', () => {
    expect(aiLanguageFor(withSettings({ language: 'id', region: 'us' }))).toBe('id');
  });

  it('uses British English for UK applications', () => {
    expect(aiLanguageFor(withSettings({ language: 'en', region: 'uk' }))).toBe('en-GB');
  });

  it('defaults English to US spelling for other regions', () => {
    for (const region of ['id', 'us', 'eu'] as const) {
      expect(aiLanguageFor(withSettings({ language: 'en', region }))).toBe('en-US');
    }
  });
});

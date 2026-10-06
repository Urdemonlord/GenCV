import { describe, expect, it } from 'vitest';
import { normalizeCV } from '@/lib/cv/normalize';
import { applySuggestion, bulletSuggestions, hasPlaceholder, summarySuggestion } from './suggestions';

const base = normalizeCV({ professionalSummary: 'Old summary.', experience: [{ id: 'e1', position: 'Dev', company: 'A' }] });
// An empty bullet the user is still typing, which is not sent to the AI.
const cv = { ...base, experience: [{ ...base.experience[0], bullets: ['Made app', '', 'Fixed bugs'] }] };

describe('AI suggestions', () => {
  it('maps model indexes back to the non-empty bullets that were sent', () => {
    const sent = [
      { index: 0, text: 'Made app' },
      { index: 2, text: 'Fixed bugs' },
    ];
    const [s] = bulletSuggestions('experience', { id: 'e1', title: 'Dev' }, sent, {
      suggestions: [{ index: 1, improved: 'Resolved [X] production bugs', reason: 'Lebih spesifik' }],
    });
    expect(s).toMatchObject({ label: 'Dev · poin 3', before: 'Fixed bugs', target: { index: 2 } });

    const next = applySuggestion(cv, s)!;
    expect(next.experience[0].bullets).toEqual(['Made app', '', 'Resolved [X] production bugs']);
    expect(hasPlaceholder(next.experience[0].bullets[2])).toBe(true);
  });

  it('refuses to apply a suggestion whose original text was edited meanwhile', () => {
    const s = summarySuggestion('Old summary.', { summary: 'New summary.', reason: '' });
    expect(applySuggestion(cv, s)?.professionalSummary).toBe('New summary.');
    expect(applySuggestion({ ...cv, professionalSummary: 'Edited by hand.' }, s)).toBeNull();
  });
});

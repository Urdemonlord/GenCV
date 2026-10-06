import { describe, expect, it } from 'vitest';
import { buildCvView, cvFileBaseName, formatDateRange, formatMonth, sortByRecency, splitDescription, toHref } from './format';
import { normalizeCV } from './normalize';

describe('formatMonth / formatDateRange', () => {
  it('formats month precision dates', () => {
    expect(formatMonth('2021-03')).toBe('Mar 2021');
    expect(formatMonth('2021')).toBe('2021');
    expect(formatMonth('March 2021')).toBe('March 2021');
  });

  it('builds ranges with Present for current roles', () => {
    expect(formatDateRange('2021-03', '', true)).toBe('Mar 2021 – Present');
    expect(formatDateRange('2019-03', '2021-02')).toBe('Mar 2019 – Feb 2021');
    expect(formatDateRange('2021-03', '2021-03')).toBe('Mar 2021');
    expect(formatDateRange('', '')).toBe('');
  });
});

describe('sortByRecency', () => {
  it('puts current roles first, then by end date, undated last', () => {
    const items = [
      { id: 'old', start: '2015-01', end: '2017-01' },
      { id: 'undated', start: '', end: '' },
      { id: 'current', start: '2020-01', end: '', current: true },
      { id: 'mid', start: '2017-02', end: '2019-12' },
    ];
    expect(sortByRecency(items, (i) => i).map((i) => i.id)).toEqual(['current', 'mid', 'old', 'undated']);
  });
});

describe('splitDescription', () => {
  it('keeps a single line as a paragraph', () => {
    expect(splitDescription('Prepared weekly reports.')).toEqual({ intro: 'Prepared weekly reports.', bullets: [] });
  });

  it('parses markdown bullets, strips bold and AI preambles', () => {
    const text = 'Here are the key achievements:\n* **Led** migration\n- Automated reporting';
    expect(splitDescription(text)).toEqual({ intro: '', bullets: ['Led migration', 'Automated reporting'] });
  });

  it('treats several unmarked lines as bullets', () => {
    expect(splitDescription('Built A\nShipped B').bullets).toEqual(['Built A', 'Shipped B']);
  });
});

describe('links and file names', () => {
  it('neutralises unsafe schemes', () => {
    expect(toHref('javascript:alert(1)')).toBe('https://alert(1)');
    expect(toHref('linkedin.com/in/x')).toBe('https://linkedin.com/in/x');
    expect(toHref('mailto:a@b.co')).toBe('mailto:a@b.co');
  });

  it('keeps unicode names in file names', () => {
    const data = normalizeCV({ personalInfo: { fullName: 'Nguyễn Thị Ánh' } });
    expect(cvFileBaseName(data)).toBe('Nguyễn-Thị-Ánh-CV');
  });
});


import { fileURLToPath } from 'node:url';
import { renderToBuffer } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { buildCvView } from '../format';
import { normalizeCVData } from '../normalize';
import { TEMPLATE_IDS } from '../templates';
import { CvDocument } from './document';
import { registerFonts } from './fonts';

registerFonts(fileURLToPath(new URL('../../../public/fonts', import.meta.url)));

const sample = normalizeCVData({
  personalInfo: {
    fullName: 'Nguyễn Thị Ánh Łukasz',
    headline: 'Senior Data Analyst',
    email: 'anh@example.com',
    phone: '+62 812 3456 7890',
    location: 'Jakarta, Indonesia',
    linkedIn: 'linkedin.com/in/anh',
  },
  professionalSummary: 'Data analyst with 6 years of experience.',
  experience: [
    { position: 'Data Analyst', company: 'Startup', startDate: '2019-03', endDate: '2021-02', description: 'Built cohort analysis' },
    {
      position: 'Senior Data Analyst',
      company: 'PT Maju Jaya',
      startDate: '2021-03',
      current: true,
      description: '- Migrated 40 reports to Power BI\n- Partnered with Kubernetes-based platform team',
    },
  ],
  skills: [{ name: 'SQL', category: 'Technical', level: 'Advanced' }],
});

/** Text in reading order, as an ATS parser would extract it. */
async function extractText(buffer: Buffer): Promise<{ pages: number; text: string; links: string[] }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise;
  const parts: string[] = [];
  const links: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    parts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    for (const annotation of await page.getAnnotations()) if (annotation.url) links.push(annotation.url);
  }
  return { pages: doc.numPages, text: parts.join('\n').replace(/\s+/g, ' '), links };
}

describe.each(TEMPLATE_IDS)('%s template', (template) => {
  it('produces ATS-readable text in reading order', async () => {
    const buffer = await renderToBuffer(<CvDocument view={buildCvView(sample)} template={template} />);
    const { pages, text, links } = await extractText(buffer);

    expect(pages).toBe(1);
    expect(text).toContain('Nguyễn Thị Ánh Łukasz');
    expect(text).toContain('Mar 2021 – Present');
    expect(text).toContain('Kubernetes-based');
    expect(text).not.toContain('[object Object]');
    // Most recent role is read before the older one.
    const recent = text.indexOf('Senior Data Analyst Mar 2021');
    const older = text.indexOf('Startup');
    expect(recent).toBeGreaterThanOrEqual(0);
    expect(older).toBeGreaterThan(recent);
    expect(links).toEqual(expect.arrayContaining(['mailto:anh@example.com', 'https://linkedin.com/in/anh']));
  });
});

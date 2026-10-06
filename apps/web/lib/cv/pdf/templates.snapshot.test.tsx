import { fileURLToPath } from 'node:url';
import { renderToBuffer } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { SAMPLE_CV } from '@/lib/sample-cv';
import { buildCvView } from '../format';
import { TEMPLATE_IDS } from '../templates';
import { CvDocument } from './document';
import { registerFonts } from './fonts';

/**
 * Layout regression test for every template, without pixel screenshots (font rasterising differs
 * between Windows and Linux CI). Each line of text is recorded with its rounded position, so a
 * change in spacing, wrapping, ordering or page breaks shows up as a snapshot diff.
 * After an intended layout change: `npx vitest run -u lib/cv/pdf/templates.snapshot.test.tsx`.
 */

registerFonts(fileURLToPath(new URL('../../../public/fonts', import.meta.url)));

async function layout(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const lines = new Map<number, { x: number; str: string }[]>();
    for (const item of (await page.getTextContent()).items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const y = Math.round(page.view[3] - item.transform[5]);
      lines.set(y, [...(lines.get(y) ?? []), { x: Math.round(item.transform[4]), str: item.str }]);
    }
    const text = [...lines.entries()]
      .sort(([a], [b]) => a - b)
      .map(([y, items]) => {
        const sorted = items.sort((a, b) => a.x - b.x);
        return `${String(y).padStart(4)} ${String(sorted[0].x).padStart(3)} | ${sorted.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()}`;
      });
    pages.push(`--- page ${n} ---\n${text.join('\n')}`);
  }
  return pages.join('\n');
}

describe('template layout snapshots', () => {
  for (const template of TEMPLATE_IDS) {
    it(template, async () => {
      const buffer = await renderToBuffer(<CvDocument view={buildCvView(SAMPLE_CV)} template={template} />);
      await expect(await layout(buffer)).toMatchFileSnapshot(`./__snapshots__/${template}.txt`);
    });
  }
});

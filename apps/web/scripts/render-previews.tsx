/**
 * Renders the sample CV with every template into public/previews/<template>.webp, so the
 * landing page and template gallery show real exporter output without loading react-pdf.
 *
 *   npm run previews
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { renderToBuffer } from '@react-pdf/renderer';
import { buildCvView } from '../lib/cv/format';
import { CvDocument } from '../lib/cv/pdf/document';
import { registerFonts } from '../lib/cv/pdf/fonts';
import { TEMPLATE_IDS } from '../lib/cv/templates';
import { SAMPLE_CV } from '../lib/sample-cv';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
registerFonts(`${publicDir}fonts`);
mkdirSync(`${publicDir}previews`, { recursive: true });

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

for (const template of TEMPLATE_IDS) {
  const cv = { ...SAMPLE_CV, settings: { ...SAMPLE_CV.settings, template } };
  const pdf = await renderToBuffer(<CvDocument view={buildCvView(cv)} template={template} />);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdf), verbosity: 0 }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  // @napi-rs/canvas is API-compatible with the DOM canvas pdf.js expects.
  await page.render({ canvasContext: context as unknown as CanvasRenderingContext2D, viewport }).promise;
  const file = `${publicDir}previews/${template}.webp`;
  writeFileSync(file, await canvas.encode('webp', 82));
  console.log(`wrote ${file} (${canvas.width}x${canvas.height})`);
}

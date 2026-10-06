/**
 * Renders the favicon set from one SVG logo: app/icon.svg, app/favicon.ico, app/apple-icon.png
 * and the web-app manifest icons in public/. Run after changing the logo:
 *   npx vite-node scripts/render-icons.ts
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const root = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url));

/** Lucide "file-text" on the brand gradient; `radius` 0 gives a full-bleed square. */
const logo = (radius: number, inset = 4) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4F46E5"/>
      <stop offset="1" stop-color="#9333EA"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${inset} ${inset}) scale(${(32 - 2 * inset) / 24})" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    <path d="M10 9H8"/>
    <path d="M16 13H8"/>
    <path d="M16 17H8"/>
  </g>
</svg>
`;

async function png(svg: string, size: number): Promise<Buffer> {
  const canvas = createCanvas(size, size);
  // Rasterise at the target size; the bare SVG would render at 32 px and blur when scaled up.
  const image = await loadImage(Buffer.from(svg.replace('<svg ', `<svg width="${size}" height="${size}" `)));
  canvas.getContext('2d').drawImage(image, 0, 0, size, size);
  return canvas.encode('png');
}

/** ICO container holding PNG images (supported by every current browser). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const rounded = logo(7);
writeFileSync(root('app/icon.svg'), rounded);
writeFileSync(root('app/favicon.ico'), ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) })))));
// iOS rounds the corners itself and shows transparency as black.
writeFileSync(root('app/apple-icon.png'), await png(logo(0), 180));
writeFileSync(root('public/icon-192.png'), await png(rounded, 192));
writeFileSync(root('public/icon-512.png'), await png(rounded, 512));
// Maskable: full-bleed background, glyph inside the 80% safe zone.
writeFileSync(root('public/icon-maskable-512.png'), await png(logo(0, 8), 512));
console.log('Icons written.');

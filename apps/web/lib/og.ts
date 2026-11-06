import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BRAND } from './brand';

/** Gaya gambar OG, dari warna merek di lib/brand.ts (= token globals.css). */
export const OG = {
  background: BRAND.yellow,
  text: BRAND.ink,
  muted: BRAND.muted,
  primary: BRAND.blue,
  accent: BRAND.blue,
  font: 'Plus Jakarta Sans',
} as const;

async function loadFont(file: string): Promise<ArrayBuffer> {
  const buf = await readFile(path.join(process.cwd(), 'public/fonts', file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** Plus Jakarta Sans, font UI situs. Berkas WOFF ada di public/fonts (lisensi OFL). */
export async function ogFonts() {
  const [bold, extraBold] = await Promise.all([
    loadFont('PlusJakartaSans-Bold.woff'),
    loadFont('PlusJakartaSans-ExtraBold.woff'),
  ]);
  return [
    { name: OG.font, data: bold, weight: 700 as const, style: 'normal' as const },
    { name: OG.font, data: extraBold, weight: 800 as const, style: 'normal' as const },
  ];
}

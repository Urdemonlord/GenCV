import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Gaya gambar OG, disamakan dengan token tema di globals.css (neon editorial):
 * latar #080B14, hijau #39FF14 (primary), magenta #FF00FF (brand accent).
 */
export const OG = {
  background: 'linear-gradient(135deg, #080B14 58%, #1F0A24)',
  text: '#F8FAFC',
  muted: '#A5AEC2',
  primary: '#39FF14',
  accent: '#FF00FF',
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

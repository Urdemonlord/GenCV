import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Gaya gambar OG, disamakan dengan token tema Ayo Kerja di globals.css:
 * latar kuning #F4E11B, teks ink #071A4A, muted #5E6B88, biru #0035AD.
 */
export const OG = {
  background: '#F4E11B',
  text: '#071A4A',
  muted: '#5E6B88',
  primary: '#0035AD',
  accent: '#0035AD',
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

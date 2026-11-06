/**
 * Warna merek Ayo Kerja sebagai hex, untuk tempat yang tidak bisa membaca
 * variabel CSS (meta theme-color, manifest PWA, gambar OG). Harus sama dengan
 * token di app/globals.css; komponen biasa pakai kelas Tailwind (bg-primary,
 * bg-brand-accent, text-foreground, ...), bukan konstanta ini.
 */
export const BRAND = {
  yellow: '#F4E11B', // --brand-accent
  blue: '#0035AD', // --primary
  ink: '#071A4A', // --foreground
  muted: '#5E6B88', // --muted-foreground
} as const;

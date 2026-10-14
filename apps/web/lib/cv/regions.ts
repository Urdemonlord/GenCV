import type { CvRegion } from './schema';

export interface RegionPreset {
  /** Shown in the "Melamar ke" dropdown. */
  label: string;
  /** Short name for advice copy, e.g. "lamaran ke AS". */
  shortLabel: string;
  /** Page size for PDF and DOCX. */
  paper: 'A4' | 'LETTER';
  /** How the paper is named in the editor preview. */
  paperLabel: string;
  /** Whether a photo is acceptable for applications in this region. */
  allowPhoto: boolean;
  /** Reason shown next to the photo field when photos are not used. */
  photoNote?: string;
  /** Soft cap on achievement bullets, from the region's page-length norm. */
  maxBullets: number;
  /** Typical page target (1 or 2), used for advice copy. */
  pageTarget: 1 | 2;
  /** Hint shown under the "Melamar ke" field. */
  hint: string;
}

/**
 * Region presets are the single source of truth for paper size, photo rules and
 * page-length guidance. Adding a region means adding a row here, not touching the
 * exporters or the analysis engine.
 */
export const REGION_PRESETS: Record<CvRegion, RegionPreset> = {
  id: {
    label: 'Indonesia',
    shortLabel: 'Indonesia',
    paper: 'A4',
    paperLabel: 'A4',
    allowPhoto: true,
    maxBullets: 30,
    pageTarget: 2,
    hint: 'Kertas A4; foto opsional untuk lamaran lokal.',
  },
  us: {
    label: 'Amerika Serikat',
    shortLabel: 'AS',
    paper: 'LETTER',
    paperLabel: 'US Letter',
    allowPhoto: false,
    photoNote: 'Foto tidak dicantumkan untuk lamaran ke Amerika Serikat.',
    maxBullets: 18,
    pageTarget: 1,
    hint: 'Kertas US Letter, usahakan 1 halaman, tanpa foto.',
  },
  uk: {
    label: 'Inggris (UK)',
    shortLabel: 'Inggris',
    paper: 'A4',
    paperLabel: 'A4',
    allowPhoto: false,
    photoNote: 'Foto tidak dicantumkan untuk lamaran ke Inggris.',
    maxBullets: 24,
    pageTarget: 2,
    hint: 'Kertas A4, tanpa foto. Usahakan 1–2 halaman.',
  },
  eu: {
    label: 'Eropa (EU)',
    shortLabel: 'Eropa',
    paper: 'A4',
    paperLabel: 'A4',
    allowPhoto: false,
    photoNote: 'Foto tidak dicantumkan untuk lamaran ke Eropa.',
    maxBullets: 24,
    pageTarget: 2,
    hint: 'Kertas A4, tanpa foto. Usahakan 1–2 halaman.',
  },
};

import { Font } from '@react-pdf/renderer';

let registeredBase: string | null = null;

/**
 * Self-hosted Unicode fonts (SIL OFL, see public/fonts). The built-in PDF fonts only
 * cover WinAnsi, which breaks names such as "Nguyễn" or "Łukasz".
 */
export function registerFonts(baseUrl = '/fonts') {
  if (registeredBase === baseUrl) return;
  registeredBase = baseUrl;

  Font.register({
    family: 'Inter',
    fonts: [
      { src: `${baseUrl}/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${baseUrl}/Inter-SemiBold.ttf`, fontWeight: 600 },
      { src: `${baseUrl}/Inter-Bold.ttf`, fontWeight: 700 },
    ],
  });
  Font.register({
    family: 'Source Serif 4',
    fonts: [
      { src: `${baseUrl}/SourceSerif4-Regular.ttf`, fontWeight: 400 },
      { src: `${baseUrl}/SourceSerif4-SemiBold.ttf`, fontWeight: 600 },
      { src: `${baseUrl}/SourceSerif4-Bold.ttf`, fontWeight: 700 },
    ],
  });

  // Hyphenated line breaks split keywords ("Kuber-netes"), which hurts ATS keyword matching.
  Font.registerHyphenationCallback((word) => [word]);
}

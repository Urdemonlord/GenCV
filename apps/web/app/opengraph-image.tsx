import { ImageResponse } from 'next/og';
import { OG, ogFonts } from '@/lib/og';

export const alt = 'Ayo Kerja · Buat CV profesional yang ramah ATS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: OG.background,
          color: OG.text,
          fontFamily: OG.font,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, display: 'flex' }}>
          Ayo <span style={{ color: OG.accent }}>Kerja</span>
        </div>
        <div style={{ marginTop: 36, fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 900, display: 'flex' }}>
          Buat CV profesional yang ramah ATS
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: OG.muted, maxWidth: 900, display: 'flex' }}>
          Template satu kolom · Analisis ATS · Job Match · Ekspor PDF & DOCX
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}

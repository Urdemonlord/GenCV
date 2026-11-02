import { ImageResponse } from 'next/og';
import { TEMPLATE_IDS } from '@/lib/cv/templates';
import { OG, ogFonts } from '@/lib/og';

export const alt = 'Template CV ramah ATS · GenCV';
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
          Gen<span style={{ color: OG.accent }}>CV</span>
        </div>
        <div style={{ marginTop: 36, fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 900, display: 'flex' }}>
          Template CV yang tetap terbaca ATS
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: OG.muted, maxWidth: 900, display: 'flex' }}>
          {`${TEMPLATE_IDS.length} template satu kolom, teks asli, judul bagian standar`}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}

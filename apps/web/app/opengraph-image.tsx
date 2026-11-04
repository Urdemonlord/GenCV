import { ImageResponse } from 'next/og';

export const alt = 'GenCV · Buat CV profesional yang ramah ATS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
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
          background: 'linear-gradient(135deg, #F4E11B 55%, #0035AD)',
          color: '#071A4A',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, display: 'flex' }}>
          Gen<span style={{ color: '#0035AD' }}>CV</span>
        </div>
        <div style={{ marginTop: 36, fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          Buat CV profesional yang ramah ATS
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#5E6B88', maxWidth: 900 }}>
          Template satu kolom · Analisis ATS · Job Match · Ekspor PDF & DOCX
        </div>
      </div>
    ),
    size
  );
}

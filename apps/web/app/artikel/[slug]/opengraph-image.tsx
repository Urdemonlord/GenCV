import { ImageResponse } from 'next/og';
import { getPost } from '@/lib/blog/posts';

export const alt = 'Artikel GenCV';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Params = Promise<{ slug: string }>;

export default async function OpengraphImage({ params }: { params: Params }) {
  const { slug } = await params;
  const title = getPost(slug)?.title ?? 'Artikel GenCV';
  // Long headlines need to shrink, or they overflow the 630px canvas.
  const fontSize = title.length > 68 ? 54 : title.length > 44 ? 62 : 70;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #0B1020 55%, #2e1065)',
          color: '#F8FAFC',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 34, fontWeight: 700, display: 'flex' }}>
            Gen<span style={{ color: '#C084FC' }}>CV</span>
          </div>
          <div style={{ fontSize: 24, color: '#94A3B8', display: 'flex' }}>· Artikel</div>
        </div>

        <div style={{ fontSize, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000, display: 'flex' }}>
          {title}
        </div>

        <div style={{ fontSize: 26, color: '#94A3B8', display: 'flex' }}>
          Template ramah ATS · Analisis ATS · Job Match · Gratis
        </div>
      </div>
    ),
    size,
  );
}

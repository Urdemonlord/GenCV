import { ImageResponse } from 'next/og';
import { allPosts } from '@/lib/blog/posts';

export const alt = 'Artikel & panduan CV · GenCV';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  const count = allPosts().length;

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
          background: 'linear-gradient(135deg, #0B1020 55%, #2e1065)',
          color: '#F8FAFC',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, display: 'flex' }}>
          Gen<span style={{ color: '#C084FC' }}>CV</span>
        </div>
        <div style={{ marginTop: 36, fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 900, display: 'flex' }}>
          Artikel &amp; panduan CV
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#94A3B8', maxWidth: 900, display: 'flex' }}>
          {`${count} panduan praktis: format ramah ATS, lamaran luar negeri, dan pengalaman`}
        </div>
      </div>
    ),
    size,
  );
}

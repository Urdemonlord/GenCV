import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ayo Kerja · Workspace CV ramah ATS',
    short_name: 'Ayo Kerja',
    description: 'Buat, optimalkan, dan sesuaikan CV dengan lowongan yang dituju.',
    lang: 'id',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: BRAND.yellow,
    theme_color: BRAND.yellow,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

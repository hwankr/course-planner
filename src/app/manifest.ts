import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'YU 수강 플래너',
    short_name: 'YU플래너',
    description:
      '영남대학교 학생을 위한 학기별 수강 계획 및 졸업 요건 추적 시스템',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#154878',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'sleepy',
    short_name: 'sleepy',
    description: 'sleep helper',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c110e',
    theme_color: '#0c110e',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

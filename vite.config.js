import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  server: {
    historyApiFallback: true
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '音樂祭行程規劃',
        short_name: '音樂祭',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#22223b',
        description: '離線可用的音樂祭行程規劃工具',
        lang: 'zh-TW',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /\/festivals\/.*\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'festival-json',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            urlPattern: /\/manifest\.webmanifest$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'manifest',
            },
          },
        ],
        navigateFallback: '/index.html',
      },
    }),
  ],
});
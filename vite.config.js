import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Vite plugin: generate festival-index.json and copy festival files to public/festivals/ */
function festivalIndexPlugin() {
  return {
    name: 'festival-index',
    buildStart() {
      generateFestivalIndex();
    },
    configureServer(server) {
      // Also run during dev server startup
      generateFestivalIndex();
      // Re-run when festival files change
      server.watcher.add(resolve(__dirname, 'festivals'));
      server.watcher.on('change', (file) => {
        if (file.includes('/festivals/') && file.endsWith('.json')) {
          generateFestivalIndex();
        }
      });
    },
  };
}

function generateFestivalIndex() {
  const festivalsDir = resolve(__dirname, 'festivals');
  const publicDir = resolve(__dirname, 'public');
  const publicFestivalsDir = resolve(publicDir, 'festivals');

  mkdirSync(publicFestivalsDir, { recursive: true });

  const files = readdirSync(festivalsDir).filter(f => f.endsWith('.json'));

  const index = files.map(filename => {
    const filePath = resolve(festivalsDir, filename);
    const content = readFileSync(filePath, 'utf-8');
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
    const data = JSON.parse(content);

    copyFileSync(filePath, resolve(publicFestivalsDir, filename));

    return {
      eventid: data.festivalId,
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      theme: data.theme,
      filename,
      filehash: hash,
    };
  });

  index.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  writeFileSync(resolve(publicDir, 'festival-index.json'), JSON.stringify(index, null, 2));
}

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  server: {
    historyApiFallback: true
  },
  plugins: [
    festivalIndexPlugin(),
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '音樂祭行程安排',
        short_name: '音樂祭行程安排',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            // festival-index.json: always try network first (stale-while-revalidate for quick UX)
            urlPattern: /\/festival-index\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'festival-index',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Individual festival JSON files: network-first with offline fallback
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
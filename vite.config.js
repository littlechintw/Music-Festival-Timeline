// @ts-check
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 在 build 階段讀 public/festivals/index.json，
// 只把 status==='upcoming' 的活動加進 precache manifest。
// archived 活動不會自動下載，使用者要的話可從 Settings 手動存。
function buildFestivalManifest() {
  const indexPath = resolve(__dirname, 'public/festivals/index.json');
  if (!existsSync(indexPath)) {
    console.warn('[pwa] public/festivals/index.json not found — run `npm run build:festivals` first.');
    return [];
  }
  /** @type {{indexHash: string, festivals: Array<{file:string, hash:string, status:string}>}} */
  const idx = JSON.parse(readFileSync(indexPath, 'utf-8'));
  /** @type {Array<{url:string, revision:string|null}>} */
  const entries = [{ url: 'festivals/index.json', revision: idx.indexHash }];
  for (const f of idx.festivals || []) {
    if (f.status === 'upcoming') {
      entries.push({ url: `festivals/${f.file}`, revision: f.hash });
    }
  }
  console.log(`[pwa] precaching ${entries.length} festival manifest entries`);
  return entries;
}

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      // injectManifest 模式：用 src/pwa/sw.js 客製化 SW，
      // vite-plugin-pwa 會把 precache manifest 注入到 self.__WB_MANIFEST。
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.js',
      // 'prompt' 模式：新 SW 下載完維持 waiting，由 UpdatePrompt.vue 觸發 skipWaiting。
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['icon-32.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: '音樂祭行程安排',
        short_name: '音樂祭',
        description: '離線可用的音樂祭行程規劃工具',
        start_url: '.',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#22223b',
        lang: 'zh-TW',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // 允許大檔（大港 4.2MB）進 precache；upcoming 才會被選中
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        additionalManifestEntries: buildFestivalManifest(),
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  build: {
    target: 'es2019',
    sourcemap: false,
  },
});

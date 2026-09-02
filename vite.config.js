// @ts-check
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

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
  define: {
    // 設定頁「關於」顯示版本號，方便回報問題時對照
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // @material/web 的 Lit custom elements（md-*），交給瀏覽器原生處理，
          // 不當成未知的 Vue 元件。
          isCustomElement: (tag) => tag.startsWith('md-'),
        },
      },
    }),
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
        // id 固定住 App 身分。沒設時 Chrome 用 start_url 當 id，之後若 start_url 或 manifest 路徑變動，
        // 已安裝的 App 會被視為「身分改變」而跳出「圖示／名稱已更新」的確認框。
        id: '/',
        name: '音樂祭行程安排',
        short_name: '音樂祭',
        description: '離線可用的音樂祭行程規劃工具',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#faf8ff',
        theme_color: '#e3e2e9',
        lang: 'zh-TW',
        categories: ['music', 'entertainment', 'lifestyle'],
        // 安裝後 App 切換器 / 長按 icon 的捷徑，直接跳到最常用的兩頁
        shortcuts: [
          { name: '我的行程', short_name: '行程', url: '/plan', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
          { name: '音樂祭列表', short_name: '音樂祭', url: '/', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // 允許大檔（大港 4.2MB）進 precache；upcoming 才會被選中
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // 不把 manifest.webmanifest 放進 precache：Chrome 會定期重新抓 manifest 比對已安裝的 App 身分，
        // 若 SW 回的是舊版快取、網路又是新版，兩邊交替就會反覆跳「圖示已更新，要檢查新圖示嗎？」。
        // 已安裝的 App 離線時不需要 manifest，所以拿掉沒有離線代價。
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        additionalManifestEntries: buildFestivalManifest(),
        // 注意：vite-plugin-pwa 仍會自己把 manifest.webmanifest 加進 additionalManifestEntries，
        // 而 Workbox 的 manifestTransforms 管不到 additionalManifestEntries，所以真正的過濾在 src/pwa/sw.js。
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

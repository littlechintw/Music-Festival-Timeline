// @ts-check
/* eslint-env serviceworker */
//
// Service Worker source（injectManifest 模式）。
// vite-plugin-pwa 在 build 時會把 precache manifest 注入到 self.__WB_MANIFEST，
// 然後把這個檔案編譯成 dist/sw.js。
//
// 設計要點：
// - precache app shell + upcoming 音樂祭 JSON（manifest 由 vite.config.js 注入）。
// - 其他 /festivals/*.json（archived、或使用者在設定頁手動「存到離線」的）走
//   StaleWhileRevalidate runtime cache，離線重開 app 時仍能讀到。
// - 'prompt' 更新模式：waiting 階段收到 SKIP_WAITING 訊息才 activate，
//   讓 UpdatePrompt.vue 可以握有「要不要立刻更新」的決定權。
// - 主畫面圖片（場地地圖、icon）走 CacheFirst + 過期清理，現場沒網路也能看。
// - periodicsync('festival-data-sync')：背景重抓 festival index。
// - notificationclick：把使用者帶回 PWA（或 focus 現有 tab）。

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 名稱要跟 src/composables/useFestivals.js 的 removeFestivalFromCache 對齊
const FESTIVAL_DATA_CACHE = 'festival-data';
const FESTIVAL_IMAGE_CACHE = 'festival-images';
const FONT_CACHE = 'app-fonts';

// 1) Precache：app shell + 由 vite-plugin-pwa 注入的 additionalManifestEntries
//    （見 vite.config.js 的 buildFestivalManifest()）。
// manifest.webmanifest 刻意不進 precache：Chrome 會定期重抓 manifest 比對已安裝 App 的名稱／圖示，
// SW 若回舊快取、網路又是新版，就會反覆跳「圖示已更新」。已安裝的 App 離線時不需要 manifest。
// @ts-ignore: __WB_MANIFEST 由 build pipeline 注入
const PRECACHE_MANIFEST = (self.__WB_MANIFEST || []).filter(
  (/** @type {{url: string}} */ entry) => !entry.url.endsWith('manifest.webmanifest')
);
precacheAndRoute(PRECACHE_MANIFEST);

// 舊版本的 precache 換版本後就清掉，避免 quota 卡住。
cleanupOutdatedCaches();

// SPA 導覽後備：離線時打開 /plan、/festival/xxx 這類深層網址（重新整理、通知點擊、主畫面捷徑），
// 一律回 precache 的 index.html，交給 vue-router 處理。沒有這條，離線只有 / 能開。
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    // 資料與靜態檔不是 SPA 頁面，不要被吃掉
    denylist: [/^\/festivals\//, /^\/assets\//, /\.[a-z0-9]+$/i],
  })
);

// 2) 非 precache 的節慶 JSON（archived / 手動存離線）：StaleWhileRevalidate。
//    precache 命中的 upcoming JSON 不會走到這裡（precacheAndRoute 先接）。
//    離線時立刻回快取；上線時背景更新，下次開啟就是新版。
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/festivals/') &&
    url.pathname.endsWith('.json') &&
    request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: FESTIVAL_DATA_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 180, // 180 天：過往活動也可能想回頭看
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 3) 場地地圖 / festival 圖片：CacheFirst（現場可能完全沒網路，先看到舊圖也行）
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' &&
    (url.pathname.startsWith('/festivals/') ||
      url.pathname.startsWith('/icon-') ||
      url.hostname !== self.location.hostname),
  new CacheFirst({
    cacheName: FESTIVAL_IMAGE_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24 * 60, // 60 天
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 4) Google Fonts / fonts.gstatic：常見字型，StaleWhileRevalidate
registerRoute(
  ({ url }) =>
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: FONT_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
      }),
    ],
  })
);

// 5) 收到主執行緒的 SKIP_WAITING 訊息（UpdatePrompt.vue 在使用者按下更新時送）
//    就跳過 waiting，搭配 registerSW 的 immediate 一起，會自動 reload。
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 安裝時不主動 skipWaiting，留給 prompt 模式控制
self.addEventListener('install', () => {
  // 不呼叫 self.skipWaiting()，讓 UpdatePrompt 控制升級時機
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 6) Periodic Background Sync：tag 必須跟 src/pwa/periodicSync.js 對齊
self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'festival-data-sync') return;
  event.waitUntil(refreshFestivalIndex());
});

async function refreshFestivalIndex() {
  try {
    // 直接打 /festivals/index.json，讓上面的 runtime cache 規則順便存一份
    // 沒網路就會 throw，吞掉即可（下次 periodicsync 再試）
    const res = await fetch('/festivals/index.json', { cache: 'no-store' });
    if (!res.ok) return;
    // 解析失敗也吞掉，重點是「曾經拉成功 = SW cache 有最新版」
    await res.json().catch(() => null);
  } catch {
    // offline / network 失敗：靜默
  }
}

// 7) 點通知 → 把 PWA 帶回前台（或開新分頁）。預設落在「我的行程」頁（路由是 /plan）。
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/plan';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ('focus' in client) {
          try {
            await client.focus();
            if ('navigate' in client && client.url !== targetUrl) {
              await client.navigate(targetUrl).catch(() => {});
            }
            return;
          } catch {
            // continue
          }
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

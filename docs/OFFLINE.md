# 離線機制 / Offline Architecture

這份文件說明 app 在沒有網路時如何運作、節慶資料如何被快取與更新。離線可用是這個專案的核心特點 — 任何離線相關修改都應該對著這份文件檢查。

---

## 1. 為什麼這專案要離線優先

使用者在音樂祭現場常常遇到：人潮太密集導致行動網路打不出去；場地下方訊號弱；漫遊資費過高所以乾脆關網。這時候「我下一場演出在哪個舞台？幾點開始？地圖在哪？」必須**毫秒級**能查到，不能轉圈。所以這個 app 的設計原則是：**讓使用者每一次需要的時候資料都已經在裝置上，網路只是「順便更新」**。

---

## 2. 三層快取

### Layer 1：Service Worker precache

Build 時就決定的「絕對要存」清單，使用者第一次造訪 app 安裝完 SW 後就會抓完。`vite.config.js` 用 injectManifest 模式，自訂 SW 在 `src/pwa/sw.js`。Precache manifest 由兩部分組成：

1. `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']` — app shell（程式碼、CSS、icon、manifest）。
2. `additionalManifestEntries`（build 時動態產生）— 讀 `public/festivals/index.json`，**只把 `status === 'upcoming'` 的活動列進去**，revision 用 SHA。

之所以不全部 precache：archived 活動使用者通常不需要再看；4MB 的舊資料每個新使用者都要下載很浪費。但仍會 list 在 index.json，使用者要的話可在 Settings 手動拉。

### Layer 2：Runtime cache（StaleWhileRevalidate / CacheFirst）

Precache 沒命中的請求進入 runtime route，依資源類型分別處理：

| 路徑 | 策略 | Cache 名稱 | 設定 |
|------|------|-----------|------|
| `/festivals/*.json` | StaleWhileRevalidate | `festival-data` | 50 entries, 30 天 |
| `request.destination === 'image'` | CacheFirst | `festival-images` | 60 entries, 30 天 |
| 跨域資源 | NetworkFirst, 5s timeout | `external-resources` | 30 entries, 7 天 |
| SPA navigation | `createHandlerBoundToURL('/index.html')` | — | denylist API + festival JSON |

StaleWhileRevalidate 的意義：**離線時立刻回快取**、上線時背景更新。使用者體驗永遠是「先看到東西、再看到新版」。

### Layer 3：localStorage（plan、settings、hash map）

不會放在 SW cache。完全在 client 端：

- `my-festival-plan` — 個人行程清單
- `my-festival-meta` — 通知偏好、上次開啟的 festival、theme override
- `notification_history` / `sent_reminders` — 通知歷史，避免重複觸發
- `is24Hour` / `enableFestivalReminders` / `performanceReminderTimes` / `enableAnalytics` — 各種偏好
- `festival_hashes_v1` — 對 `festivalId → hash` 的本地映射，是 SHA 更新偵測的核心
- `offline_mode` / `offline_pinned` — 離線管理偏好（auto/manual + 手動 pin 清單）

---

## 3. SHA-based 更新流程

每個 festival JSON 都有 SHA-256 前 12 碼當 revision。Build 時計算、塞進 `public/festivals/index.json`，client 端比對。

### Build 時（`scripts/build-festival-index.mjs`）

```
for each festivals/*.json:
  raw   = readFileSync(file)
  hash  = sha256(raw).slice(0, 12)
  bytes = raw.byteLength
  status = endTime > now - 3 days ? 'upcoming' : 'archived'
  push to index

indexHash = sha256(JSON.stringify({version:2, festivals: sortedIndex}))
write public/festivals/index.json with all metadata
```

`indexHash` 是讓 Workbox 知道 index.json 自身有沒有改 — `vite.config.js` 用它當 `additionalManifestEntries` 的 revision。

### Client 同步（`src/composables/useFestivals.js`）

```
syncFestivals(opts):
  index = fetch('/festivals/index.json', cache:'no-cache')   // NetworkFirst + SW fallback
  hashes = localStorage[festival_hashes_v1]

  for each entry in index.festivals:
    if cached_in_memory && hashes[id] === entry.hash:
      use cached                                                // 0 network
      continue

    if !wantOffline && !cached:
      skip                                                      // 0 network
      continue

    data = fetch('/festivals/{file}', cache:'no-cache')
    hashes[id] = entry.hash
    push to result

  save hashes
```

**重點**：hash 一樣就完全不打網路抓 festival JSON。大部分啟動只抓一個小小的 index.json，其他全部命中本地。

### 更新觸發點

- App `onMounted`：`festivalStore.ensureLoaded()`（有 5 分鐘 staleness 保護，剛抓過不重抓）
- App `setInterval` 每 6 小時：`ensureLoaded()`（背景時不跑，前景回來補跑）
- `window.online` 事件：`ensureLoaded({ force: true })`
- Settings「立即檢查更新」：`ensureLoaded({ force: true })`
- SW periodicsync（Chromium PWA）：`festival-data-sync` tag 觸發背景同步

---

## 4. 離線管理 UI

`Settings.vue` 的「離線資料管理」section 給使用者手動控制：

- **自動 / 手動模式**：auto 預設、自動把 upcoming 都納入；切 manual 後只動使用者 pin 過的。
- **每個 festival row**：名稱、開始日、大小、狀態徽章（已離線 / 可更新 / 未離線）、動作鈕（存到離線 / 更新 / 移除離線）。
- **總用量**：`navigator.storage.estimate()` 顯示已用 / 配額。
- **立即檢查更新**：強制重抓 index.json + 重新對比 hash。

操作對應的 SW cache 動作：

| UI 動作 | 程式行為 |
|---------|----------|
| 存到離線 / 更新 | `fetch(url, { cache: 'reload' })` → SW 接住 → 進 `festival-data` cache |
| 移除離線 | `caches.open('festival-data').delete(url)` + `localStorage[festival_hashes_v1]` 移除該 id |

---

## 5. 版本升級

PWA 部署新版時，`registerType: 'prompt'` 模式下流程：

1. 使用者下次造訪 / reload → browser 拉新 SW 並下載新 precache 內容
2. 新 SW 進入 `waiting` state（**舊 SW 仍服務當前頁面，避免中斷**）
3. workbox-window 觸發 `onNeedRefresh` → `UpdatePrompt.vue` 顯示「有新版本可用 [立即更新][稍後]」
4. 使用者按更新 → `updateSW(true)` 送 `SKIP_WAITING` 訊息給新 SW → 新 SW activate → workbox `clientsClaim` 接管 → 頁面 reload
5. 使用者按稍後 → banner 收起；下次重整或重開分頁自然套用

不會在使用者正在用的時候強制更新打斷流程。

---

## 6. PeriodicSync（progressive enhancement）

`src/pwa/periodicSync.js` 嘗試註冊 `festival-data-sync` tag 給 SW。要件：

- Chromium 系（Chrome / Edge）
- 使用者「安裝 PWA」
- 在 chrome://settings/content/backgroundSync 授權該站

支援的話 SW 會每 6 小時被叫醒一次（精確時間由 OS 決定），在背景把 upcoming festival JSON 重新拉一份進 cache。不支援的環境直接安靜 no-op，不影響使用者。SW handler 在 `src/pwa/sw.js` 的 `periodicsync` 事件處理裡。

---

## 7. 邊角情境與處理

| 情境 | 行為 |
|------|------|
| 第一次拜訪 + 無網路 | SW 還沒裝完，沒救 — 但這本來就是 offline-first 的前提：至少裝完一次 |
| index.json 抓不到（線上時 5xx） | `fetchIndex` fallback 走 SW cache 拿上次的版本 |
| 完全離線 + SW cache 也沒 index | `fetchIndex` 回 `null`，UI 顯示「尚未載入活動索引」，已快取的 festival 仍可瀏覽 |
| hash 對得上但使用者清掉了 SW cache | 下次 ensureLoaded 自然重抓並回填 |
| 系統時鐘大跳 / 進入睡眠後恢復 | `reminders.js` 用 `MAX_TIMEOUT_MS = 15 分鐘` 上限，避免長眠醒來瞬間 catch-up 一堆通知 |
| 使用者在現場拔網路 | runtime cache StaleWhileRevalidate 維持讀取 cache 部分；分享網址等需要網路的功能顯示「離線中無法分享」 |

---

## 8. 測試與驗證

- `npm run build:festivals`：手動產生 / 更新 `public/festivals/index.json` 和檔案副本
- `npm run validate:festivals`：跑 Zod schema 驗證、過濾過期活動
- `npm run build`：完整 build；產出 `dist/sw.js`，console log 會顯示 precache 條目數與 festival 條目數
- `npm test`：跑 vitest 包含 `useFestivals.test.js` 的 hash diff 邏輯測試
- 手動測：Chrome DevTools → Application → Service Workers + Cache Storage 檢查 precache 內容
- 手動測：DevTools Network 切 Offline → 重整應該還能用所有頁面（除了分享）

---

## 9. 不做什麼

刻意避免的設計：

- **完全 NetworkFirst**：很多 PWA 教學會推 NetworkFirst，但在現場 5G 訊號爛時 fetch 會 hang 5 秒才 fallback，體感很差。我們對 festival 資料用 StaleWhileRevalidate，立刻給結果。
- **localStorage 存 festival 資料**：JSON 一個 4MB，幾個就破 localStorage 5MB 上限。完全交給 SW cache。
- **背景送通知**：通知排程跑在前景 setTimeout（visibility-aware）。要真正的 OS 級背景通知需要 push server，超出單機 PWA 範圍。
- **localStorage 加密**：個人行程不算機敏資料，不值得引入加密庫的 bundle 成本。

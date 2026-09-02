# 離線機制 / Offline Architecture

這份文件說明 app 在沒有網路時如何運作、節慶資料如何被快取與更新。離線可用是這個專案的核心特點 — 任何離線相關修改都應該對著這份文件檢查。

---

## 1. 為什麼這專案要離線優先

使用者在音樂祭現場常常遇到：人潮太密集導致行動網路打不出去；場地下方訊號弱；漫遊資費過高所以乾脆關網。這時候「我下一場演出在哪個舞台？幾點開始？地圖在哪？」必須**毫秒級**能查到，不能轉圈。所以這個 app 的設計原則是：**讓使用者每一次需要的時候資料都已經在裝置上，網路只是「順便更新」**。

---

## 2. 三層快取

### Layer 1：Service Worker precache

Build 時就決定的「絕對要存」清單，使用者第一次造訪 app 安裝完 SW 後就會抓完。`vite.config.js` 用 injectManifest 模式，自訂 SW 在 `src/pwa/sw.js`。Precache manifest 由兩部分組成：

1. `globPatterns: ['**/*.{js,css,html,ico,png,svg}']` — app shell（程式碼、CSS、icon）。**刻意不含 `manifest.webmanifest`**：Chrome 會定期重抓 manifest 比對已安裝 App 的名稱／圖示，SW 若回舊快取會讓使用者反覆看到「圖示已更新」的確認框；已安裝的 App 離線時不需要 manifest。
2. `additionalManifestEntries` — 只有 `festivals/index.json`（revision 用 `indexHash`）。

**活動 JSON 一律不 precache。** 要下載哪些由執行期規則決定（見第 3 節），這樣使用者在設定頁移除的資料才不會被 SW 在下次安裝時硬塞回來。

### Layer 2：Runtime cache（StaleWhileRevalidate / CacheFirst）

Precache 沒命中的請求進入 runtime route，依資源類型分別處理：

| 路徑 | 策略 | Cache 名稱 | 設定 |
|------|------|-----------|------|
| `/festivals/*.json`（precache 沒命中的：archived、手動存離線） | StaleWhileRevalidate | `festival-data` | 50 entries, 180 天 |
| `request.destination === 'image'`（`/festivals/`、`/icon-`、跨域圖片） | CacheFirst | `festival-images` | 80 entries, 60 天 |
| Google Fonts（`fonts.googleapis.com` / `fonts.gstatic.com`） | StaleWhileRevalidate | `app-fonts` | 30 entries, 1 年 |
| SPA navigation | precache 的 `index.html` | — | 由 `precacheAndRoute` 處理 |

實際的 route 定義都在 `src/pwa/sw.js`，改這張表時請同步改程式（或反過來）。

StaleWhileRevalidate 的意義：**離線時立刻回快取**、上線時背景更新。使用者體驗永遠是「先看到東西、再看到新版」。

### Layer 3：localStorage（plan、settings、hash map）

不會放在 SW cache。完全在 client 端：

- `my-festival-plan` — 個人行程清單
- `my-festival-meta` — plan 資料的 schema 版本（未來 migration 用）
- `saved-shared-plans-v1` — 朋友分享後「另存」的行程
- `notification_history` / `sent_reminders` — 通知歷史與去重紀錄，避免重複觸發
- `is24Hour` / `enableFestivalReminders` / `performanceReminderTimes` / `enableAnalytics` / `enableMarqueeAnimation` — 各種偏好
- `theme-pref-v1` — 亮／暗／跟隨系統
- `install-prompt-dismissed-at` — 使用者關掉「安裝到主畫面」提示的時間（14 天內不再顯示）
- `festival_hashes_v1` — 對 `festivalId → hash` 的本地映射，是 SHA 更新偵測的核心
- `offline_last_used_v1` — `festivalId → 最後使用時間`，決定非近期活動要保留到哪天（舊版的 `offline_mode` / `offline_pinned` 首次啟動時會自動遷移並刪除）

---

## 3. 哪些活動會在裝置上：保留規則與 SHA 更新

### 保留規則（`src/composables/useFestivals.js` 的常數）

| 常數 | 值 | 意義 |
|------|----|------|
| `AUTO_FUTURE_DAYS` | 30 | 開始時間在未來 30 天內的活動自動下載 |
| `AUTO_PAST_DAYS` | 14 | 結束時間在過去 14 天內的活動仍自動保留 |
| `RETENTION_DAYS` | 30 | 非近期活動：最後使用後 30 天沒再打開就移除 |

`isInAutoWindow(entry)` 判斷前兩條；「使用」的定義是打開該活動的詳情／時間軸／地圖（`festivalStore.ensureFestival` 會 `offlineStore.touch(id)`），或第一次被下載進裝置（`touchIfMissing`）。每次同步時 `shouldKeep(entry) = isInAutoWindow(entry) || offlineStore.isRecentlyUsed(id)`：

- 該留、hash 一樣、記憶體有 → 直接用，0 網路
- 該留、hash 不同或剛開 app → `fetch`（線上拿新版；離線由 SW cache 供應）
- 不該留、之前下載過 → 從 `festival-data` cache 與 `festival_hashes_v1` 移除，並清掉最後使用時間

列表頁只需要索引：`index.json` 每筆帶 `location`、`stageCount`、`performanceCount`、`themePrimary`，所以沒下載的活動一樣能顯示卡片。點進去時 `ensureFestival(id)` 按需下載；離線又沒快取則顯示「這場音樂祭還沒下載到手機」，連上網路自動重試。

### Build 時（`scripts/build-festival-index.mjs`）

```
for each festivals/*.json:
  raw   = readFileSync(file)
  hash  = sha256(raw).slice(0, 12)
  bytes = raw.byteLength
  status = endTime > now - 3 days ? 'upcoming' : 'archived'
  location / stageCount / performanceCount / themePrimary  ← 列表卡片用
  push to index

indexHash = sha256(JSON.stringify({version:2, festivals: sortedIndex}))
write public/festivals/index.json with all metadata
```

`indexHash` 是讓 Workbox 知道 index.json 自身有沒有改 — `vite.config.js` 用它當 precache revision。

### Client 同步（`src/composables/useFestivals.js`）

```
syncFestivals({ shouldKeep, getCached }):
  index  = fetch('/festivals/index.json', cache:'no-cache')   // 失敗退回 SW cache
  hashes = localStorage[festival_hashes_v1]

  for each entry in index.festivals:
    if !shouldKeep(entry):
      if hashes[id]: delete from festival-data cache, delete hashes[id], evicted.push(id)
      continue
    if getCached(id) && hashes[id] === entry.hash:
      use cached                                                // 0 network
      continue
    data = fetch('/festivals/{file}', cache:'no-cache')          // SW: StaleWhileRevalidate
    hashes[id] = entry.hash

  save hashes
  return { index, festivals, errors, evicted }
```

**重點**：hash 一樣就完全不打網路抓 festival JSON。大部分啟動只抓一個小小的 index.json，其他全部命中本地。

### 更新觸發點

- App `onMounted`：`festivalStore.ensureLoaded()`（有 6 小時 staleness 保護，剛抓過不重抓）
- App `setInterval` 每 6 小時：`ensureLoaded()`（背景時不跑，前景回來補跑）
- `window.online` 事件：`ensureLoaded({ force: true })`
- Settings「立即檢查更新」：`ensureLoaded({ force: true })`
- 打開活動頁面：`ensureFestival(id)`（沒下載就抓，並更新最後使用時間）
- SW periodicsync（Chromium PWA）：`festival-data-sync` tag 觸發背景同步

---

## 4. 離線管理 UI

`Settings.vue` 的「離線資料管理」section **只列出裝置上有的活動**：

- 說明文字直接引用 `AUTO_FUTURE_DAYS` / `AUTO_PAST_DAYS` / `RETENTION_DAYS`，改常數文案會跟著變。
- **近期活動**：標示「近期活動・自動保留」，沒有移除鈕（移了下次同步也會自動下載回來，與其讓使用者困惑不如不給）。
- **其他活動**：顯示「再保留 N 天」，可手動移除；移除後點開它會重新下載。
- **有新版**：索引 hash 與本地不同時出現「更新」鈕。
- **總用量**：`navigator.storage.estimate()` 顯示已用 / 配額。
- **立即檢查更新**：強制重抓 index.json + 重新對比 hash + 清掉過期的。

操作對應的程式行為：

| UI 動作 | 程式行為 |
|---------|----------|
| 更新 | `festivalStore.refreshFestival(id)` → `fetch(url, { cache: 'no-cache' })` → SW 的 StaleWhileRevalidate route 存進 `festival-data`，更新 `festival_hashes_v1` |
| 移除 | `festivalStore.removeFestival(id)` → `caches.open('festival-data').delete(url)` + 移除 hash + 移除最後使用時間 + 從記憶體移除 |

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
| 離線點開沒下載過的活動 | 詳情／時間軸／地圖顯示「這場音樂祭還沒下載到手機」＋重試鈕；`online` 事件觸發時自動重抓 |
| 收到朋友分享但沒有那場活動的資料 | 短網址／QR 解碼前先 `ensureFestival(festivalId)` 按需下載；離線且沒快取時提示需要連線一次 |
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

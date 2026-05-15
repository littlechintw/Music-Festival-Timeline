# Music Festival Timeline — Refactor Plan

> 本文件是針對 `main` 分支當下狀態進行的全面 audit 與 refactor 計畫。離線可用性是核心特點，所有設計決策都以「沒有網路也要能用」為前提。

---

## 1. 立即影響運行的嚴重問題（main 分支當下無法正常運作）

| # | 問題 | 影響 |
|---|------|------|
| C1 | `router/index.js`、`App.vue` 引用了不存在的檔案：`stores/festival.js`、`views/FestivalList.vue`、`views/FestivalDetail.vue` | `npm run build` 失敗、頁面無法載入。檔案存在於 `feat/new_offline_data_process` 分支但沒被合進 main。 |
| C2 | **沒有 `vite.config.js`** | `vite-plugin-pwa` 雖然在 `package.json`，但完全沒有被啟用 → **沒有 service worker，根本還沒有離線能力**。README 寫的 "fully offline" 是空頭支票。 |
| C3 | `index.html`、`404.html` 引用 `/mf_32.ico`、`/mf_192.ico`、`/mf_512.ico` | `public/` 只有 `icon-*.png`，每次載入都會 404。Favicon 顯示不出來。 |
| C4 | `.github/workflows/validate-festivals.js` 用 `require()` import `src/pwa/schema.js`（ESM） | Node 20 在 ESM 檔上 `require()` 會丟錯。CI 跑不起來，所以 `data-live` 分支沒辦法 publish。 |
| C5 | `EditorView.vue` 用 `festival.contributors`，但 `festivalSchema` 沒有此欄位 | `parseAsync(festival)` 一定失敗，使用者填了東西匯出時報錯。 |
| C6 | `Settings.vue` 開頭有錯位 `<label>` 包住 `<h1>` | 標題之前會有一個空 label，rendering 與 a11y 都怪。 |
| C7 | `festivals/` 在 repo 根目錄而非 `public/festivals/` | 只能靠 `import.meta.glob` 打包進 bundle，沒辦法以靜態檔提供，未來 SW 無法獨立快取與更新節慶資料。Editor 的教學還寫「放到 `/public/festivals/`」自相矛盾。 |
| C8 | `MapView.vue` 的 `fetch(image, { cache: 'reload' })` | `cache:'reload'` 會**繞過 cache**，剛好跟離線目的相反。應該交給 SW 用 CacheFirst 處理。 |
| C9 | `package.json` 有 `lint` 腳本但完全沒裝 eslint | `npm run lint` 一定失敗。 |

## 2. 離線可用性（這是專案核心，列為最高優先）

| # | 問題 | 解決方向 |
|---|------|----------|
| O1 | 沒有 service worker（C2） | 新增 `vite.config.js`，啟用 `VitePWA` 用 `registerType: 'autoUpdate'`、`workbox.precacheAndRoute` 把 app shell 全部 precache。 |
| O2 | 節慶 JSON 透過 `import.meta.glob` 綁進 main bundle | 改為靜態檔 `/festivals/<id>.json` + 索引 `/festivals/index.json`。先 `cache.match` 再 `fetch`（StaleWhileRevalidate），離線可用、上線時自動更新。 |
| O3 | 場地地圖（base64 / 外部 URL）沒有顯式快取規則 | Workbox runtime caching：對 `image/*` 用 CacheFirst + ExpirationPlugin（最多 30 張地圖，30 天）。 |
| O4 | 4 個 view 各自重複寫 festival loader | 集中到 `composables/useFestivals.ts` + `stores/festival.js`，所有頁面共用，offline / online 行為一致。 |
| O5 | 短網址 / GAS API 依賴網路、失敗只彈 alert | 增加 `composables/useOnline.js`、`<OfflineBanner />`，分享按鈕在離線時 disable 並顯示說明（fallback：直接複製長網址）。 |
| O6 | 通知排程靠 `setInterval(...10s)` 跑在前景 | App 關閉就不會通知；至少要加：(a) `Notification.permission` 提示優化；(b) `pageshow` 重新校時；(c) 若支援 `PeriodicSync` 註冊週期任務（不支援就維持前景輪詢）；(d) 把通知顯示交給 SW 以便鎖屏觸發。 |
| O7 | 沒有「app 已離線可使用」提示 | 第一次安裝完成後 toast 提示，並在 navbar 顯示連線狀態圖示。 |

## 3. Bug 與資料一致性

- B1 `MyPlan.vue` 用 `setInterval` 每 30 秒把 `plan.value = planStore.myPlan`，Pinia 本來就是響應式，這只是無謂的 re-render。
- B2 perf id 在 3 個地方用不同公式（`perf.id || perf.artist+perf.start`、`festivalId + stage + artist + start`、`stage.name + perf.artist`）→ 抽到 `utils/perfId.js`。
- B3 `RedirectShortUrl.vue` 在 import 行程後 `planStore.myPlan = parsedPlan.value`，沒去重；若使用者已經有同場演出資料會覆蓋。
- B4 `planStore.invalidShows = []` 直接從 template 改 store state，應該包成 action。
- B5 `notificationHistory.value.pop()` 想保留 100 筆但 `pop()` 是移除最後一筆（最舊），而 `unshift` 是塞最前面，所以方向其實是對的；不過邊界條件下若連續送通知會掉資料，改用 `slice(0,100)`。
- B6 `validatePlan` 比對 `matchEnd && matchEnd !== originalEnd`，當原本資料沒 end 但新資料有 end 時 `matchEnd` 是 truthy 但 `originalEnd` 會是 NaN → 永遠不相等 → 誤判失效。
- B7 編輯器 `addStage` 沒生成 `id`，schema 要求 string，匯出時會被擋。
- B8 `useSettingsStore` 用 options syntax 在 state 建立時讀 localStorage，這在 SSR / 測試會炸；改成 setup syntax + 明確 `init()`。

## 4. 效能

- P1 `MyPlan.vue` 那個 30 秒 setInterval（已列為 B1）。
- P2 兩個時間軸頁面（MyPlan + RunDownTimeline）每秒重算 `currentTime` 並重算 grid → 抽出 `useNowTicker(1000)` 並只在 *當天* 視圖 mount。其他日期不需要 ticker。
- P3 大量重複 `new Date(perf.start)` → 預先標準化成 epoch ms 儲存於 store 衍生 cache。
- P4 `colorTheme` map 算字串 hash，是純函式可 memo（小幅）。
- P5 Festival JSON 改成靜態 fetch 後 bundle 變小（火球祭 2025 + 鯨港 2026 加上 base64 圖會佔 main bundle 不少 KB）。

## 5. 可維護性 / 結構

- M1 沒有 `tsconfig`／`jsconfig`。完整 TS 遷移耗時，先加 `jsconfig.json` + `// @ts-check` + JSDoc 型別，主要 utils 與 stores 都會有型別提示，未來再升 TS。
- M2 沒有 eslint config / prettier。加 `.eslintrc.cjs`、`.prettierrc`，並把 `eslint`、`@vue/eslint-config-prettier`、`eslint-plugin-vue` 列入 devDependencies。
- M3 Stores 用 options syntax，跟 view 都用 `<script setup>` 不一致 → 改成 Pinia setup store。
- M4 重複的時間軸 gantt-grid 邏輯 (MyPlan + RunDownTimeline) 抽成 `composables/useTimelineGrid.js` + `<TimelineGrid />` 元件。
- M5 重複的「載入 festivals」邏輯（5 個地方）抽成 `composables/useFestivals.js` 並只由 store 觸發。
- M6 `notificationHistory` 全域 ref 改成獨立 store `stores/notifications.js`。
- M7 `App.vue` 的彈窗邏輯抽成 `<InvalidShowsModal />` 元件。
- M8 顏色 / theme 邏輯抽到 `utils/theme.js`。
- M9 README 與實際結構不符，更新並補一份「離線使用機制」說明。

## 6. 安全 / 隱私

- S1 `analytics.js` 沒做 DNT / opt-out（在 Settings 加 toggle）。
- S2 短網址服務 (GAS) URL 沒驗證 response shape → 加最小欄位驗證避免 XSS。
- S3 編輯器 base64 圖片可塞惡意 SVG（XSS via `<img src="data:image/svg+xml,...">`）→ 改成只接受 raster image (`image/png|jpeg|webp`)。

---

## 7. 分階段 Refactor 計畫

### Phase A — 穩定離線基礎（本 PR 範圍）
1. 新增 `vite.config.js` 啟用 `VitePWA`，明確規劃 cache 策略（app shell + festivals + map images）。
2. 新增 `jsconfig.json`、`.eslintrc.cjs`、`.prettierrc`、補 devDependencies。
3. 把 `festivals/` 移到 `public/festivals/`，並產生 `public/festivals/index.json`（CI 也產生這份）。
4. 統一 festival loader：`composables/useFestivals.js` + `stores/festival.js` setup store。
5. 還原 `views/FestivalList.vue`、`views/FestivalDetail.vue`，並改用集中 loader。
6. 修 `index.html` 圖示路徑、加 `<meta name="theme-color">`、preconnect。
7. 修 `validate-festivals.js`：把 schema 的核心驗證改用 `node` 原生 + 抽出 plain JS schema (`src/pwa/schema.js` 改寫成同時可被 node ESM 與 Vite 使用)。
8. 修 `Settings.vue` 開頭錯位的 `<label>`。
9. 修 `EditorView.vue`：`contributors` 加入 schema 為 optional，`addStage` 自動產生 id（slug + nanoid 短碼），圖片限制 mime。
10. 加 `<OfflineBanner />`、`composables/useOnline.js`。

### Phase B — Stores / Utils 重整
11. `stores/plan.js`：setup syntax、抽出 `usePersistedState` composable、`invalidShows` 改用 action。
12. `stores/settings.js`：setup syntax、`enableAnalytics` 開關。
13. `stores/notifications.js`：取代 `utils/notificationHistory.js`。
14. `utils/perfId.js`：統一 ID 公式，並讓 plan/timeline 都用同一個。
15. `utils/theme.js`：抽出顏色決策、加上 memo。
16. `composables/useNowTicker.js`：用 `requestAnimationFrame` 節流 + visibility-aware（背景時不跑）。
17. `composables/useTimelineGrid.js`：抽出 timeSlots / grid style 計算。
18. `components/TimelineGrid.vue`：MyPlan & RunDownTimeline 都消費這個元件。

### Phase C — 通知 / SW
19. `src/pwa/registerSW.js`：註冊 SW + `appReady` event + update prompt。
20. `src/pwa/notifications.js`：封裝 `requestPermission` + `showNotification`，優先走 SW。
21. `utils/reminders.js`：改用 setup store + visibilitychange + 把單一 setInterval 改為下次觸發點動態算（不需要 10 秒固定輪詢）。
22. 探索 `PeriodicSyncManager`（Chromium）作為 progressive enhancement。

### Phase D — TS / Lint / DX
23. JSDoc 型別覆蓋 schema、stores、utils。
24. 加 `npm run typecheck`（`vue-tsc --noEmit` 對 .vue + 透過 jsconfig 檢 .js）。
25. ESLint + Prettier 全跑過，補 hook formatting。
26. 加 vitest 與基礎 unit test：`perfId`、`url` 壓縮、`ics` 生成、`reminders` 觸發點計算。

### Phase E — 文件
27. 更新 `README.md`：架構圖、離線機制說明、貢獻 JSON 流程（公開資料夾改到 `public/festivals/`）。
28. 在 `docs/OFFLINE.md` 寫 SW 行為說明、cache key、版本升級流程。

---

## 8. 對外 API / 行為相容性

- ✅ localStorage key 全部維持（`my-festival-plan`、`my-festival-meta`、`notification_history`、`sent_reminders`、`performanceReminderTimes`、`is24Hour`、`enableFestivalReminders`、`theme-override`）。
- ✅ 分享 URL 編碼格式 `festId;stage:MMDDHHmm,...;...` 維持。
- ⚠️ Festival JSON 來源從 `import.meta.glob` 改為 `fetch /festivals/*.json`。需要保留向後相容的 fallback（找不到 index.json 時退回 glob）。
- ⚠️ Editor 教學文字要改成「放到 `public/festivals/`」。

## 9. 風險與緩解

- **PWA cache 卡舊版**：用 `registerType: 'autoUpdate'` + `skipWaiting` + `clientsClaim`，並在 UI 顯示「有新版本，重新整理」的 prompt。
- **離線狀態下用戶想分享**：明確顯示 disabled + 文案，避免使用者誤以為 bug。
- **節慶資料更新頻率**：CI publish `data-live` 分支 → SW 用 StaleWhileRevalidate，下次開啟自動拉新版。

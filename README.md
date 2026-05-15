# 🎵 Music Festival Timeline 音樂祭行程助手

<div align="center">
  A modern, offline-first web app for music festival lovers to track, plan, and share their event itineraries.
  <br>
  專為音樂祭愛好者打造的離線優先網頁工具，輕鬆追蹤、規劃與分享你的專屬行程。
</div>

---

## ✨ Features / 核心功能

- 🎟 **Festival Catalog | 音樂祭列表** — 瀏覽即將到來與過往的音樂祭，支援搜尋、依日期或名稱排序。
- 📅 **Interactive Timetable | 互動式時間軸** — 視覺化全日時間軸，多舞台網格一目了然，並標示「現在」紅線。
- 📝 **Personal Plan Builder | 個人行程規劃** — 一鍵將喜愛的演出加入「我的行程」，跨多個音樂祭也行。
- 🔔 **Smart Reminders | 智慧提醒** — 在演出前自訂分鐘（如 10/5/3 分鐘前）以及音樂祭開始前 7 天、1 天主動推播。通知透過 Service Worker 觸發，即便分頁失焦也能彈。
- 🔗 **Share Your Plan | 快速分享行程** — 產生短網址分享，朋友可一鍵預覽匯入。
- 📡 **Offline-first | 真正離線可用** — 啟動過一次後，整個 app shell、所有節慶資料與場地地圖都會被 Service Worker 快取，現場沒有訊號也能查行程。
- ⚙️ **Customizations | 偏好設定** — 12/24 小時制切換、通知時機自選、Google Analytics 可關閉、清除離線快取。

---

## 🚀 Getting Started / 快速開始

```bash
# 1. Clone the repository
git clone https://github.com/littlechintw/Music-Festival-Timeline.git

# 2. Go to project directory
cd Music-Festival-Timeline

# 3. Install dependencies
npm install

# 4. Build festival index (從 festivals/ 同步到 public/festivals/ 並產生 index.json)
npm run build:festivals

# 5. Start development server
npm run dev
```

開啟 `http://localhost:5173` 即可預覽。

> **Note**: 分享網址功能需要設定 `VITE_GAS_URL`，指向你部署的 Google Apps Script 短網址服務。離線時這個按鈕會自動 disable。
>
> 若想啟用匿名使用統計（GA4），請另外設定 `VITE_GA_MEASUREMENT_ID`。使用者可在「設定」頁關閉。

---

## 📂 專案結構

```
src/
  App.vue                  入口元件，掛 OfflineBanner / InvalidShowsModal / UpdatePrompt
  main.js                  Vue + Pinia + Router bootstrap
  router/                  Lazy-loaded routes
  components/
    OfflineBanner.vue      離線狀態提示
    UpdatePrompt.vue       PWA 有新版本時提示
    InvalidShowsModal.vue  時間表異動通知 modal
    TimelineGrid.vue       甘特圖式時間軸（MyPlan / RunDownTimeline 共用）
  composables/
    useFestivals.js        從 /festivals/index.json fetch（含 bundle 後備）
    useNowTicker.js        當下時間 ref，背景時自動暫停
    useOnline.js           navigator.onLine 響應式 ref
    usePersistedState.js   localStorage 自動同步
    useTimelineGrid.js     time slots / grid style 計算
  pwa/
    schema.js              Zod 節慶 JSON schema（瀏覽器 + Node script 共用）
    registerSW.js          PWA service worker 註冊與更新流程
  stores/
    festival.js            節慶資料（離線優先載入）
    plan.js                我的行程 + 通知 helper
    settings.js            時間格式、通知偏好、analytics 開關
    notifications.js       通知歷史
  utils/
    perfId.js              統一的演出 ID 公式
    format.js              時間／日期 i18n helper
    theme.js               音樂祭顏色
    url.js                 分享行程編碼／解碼
    reminders.js           提醒服務（visibility-aware setInterval）
    ics.js / calendar.js   匯出 ICS / Google Calendar
    analytics.js           GA：未設定 / 離線 / 使用者關閉時 noop
festivals/                 原始資料（PR 從這裡進來）
public/festivals/          build 時同步的執行期資料（SW 會快取）
scripts/
  build-festival-index.mjs CI / 本地都用同一份索引腳本
  validate-festivals.mjs   用 Zod schema 驗 + 篩選即將到來的活動
```

---

## 📡 離線機制 / Offline behaviour

- **Service worker**：`vite-plugin-pwa` + Workbox，build 時自動產生 `dist/sw.js`，使用 `autoUpdate` 策略。
- **App shell**：JS/CSS/HTML/圖示全部預先快取，第一次造訪後就能完全離線啟動。
- **節慶資料**：`/festivals/*.json` 採 `StaleWhileRevalidate` — 離線時直接命中快取，連線時自動更新。
- **場地地圖**：所有 `image` 請求 `CacheFirst`，最多 60 張、保留 30 天。
- **外部資源**：`NetworkFirst` 加 5 秒超時，避免連到不穩網路時整個 app 卡住。
- **更新提示**：偵測到 service worker 有新版本時，畫面右下角會跳「立即更新」按鈕。
- **降級**：分享網址、Google Analytics 等仰賴網路的功能會在離線時自動 disable / no-op。

---

## 🤝 Contributing / 貢獻指南

歡迎送 PR：新增音樂祭 JSON、修 bug、提出新功能都歡迎。

新增音樂祭步驟：

1. Fork 並 clone。
2. 在 `festivals/` 加上你的 `<festival-id>.json`，或使用 `/editor` 頁面匯出。
3. 跑 `npm run validate:festivals` 確認 schema 通過。
4. Commit 後送 PR。CI 會自動驗證並把 `public/festivals/index.json` 更新到 `data-live` 分支。

### ⚠️ Important Notice / PR 注意事項

提交 PR 即代表您同意本專案的雙授權模式（Dual-License）條款。

---

## ⚖️ License

**Dual-License (雙授權)**：個人非商用免費（CC BY-NC 4.0，需標注作者）；商用需另外洽談授權。

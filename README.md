# 🎵 音樂祭行程 Music Festival Timeline

**離線優先的音樂祭行程規劃 PWA。** 瀏覽各音樂祭的完整時間表、把想看的演出排成自己的行程、演出前收到提醒，現場沒訊號也能查。裝到手機主畫面後就像一個原生 App。

> An offline-first PWA for festival-goers: browse timetables, build a personal run-down, get reminders before each set, and keep everything usable with zero signal on site. Traditional Chinese UI.

<p align="center">
  <img src="docs/screenshots/list.png" width="190" alt="音樂祭列表" />
  <img src="docs/screenshots/detail.png" width="190" alt="音樂祭詳情與演出陣容" />
  <img src="docs/screenshots/timeline.png" width="190" alt="全日時間軸" />
  <img src="docs/screenshots/plan.png" width="190" alt="我的行程" />
</p>
<p align="center">
  <img src="docs/screenshots/map.png" width="190" alt="場地地圖" />
  <img src="docs/screenshots/settings.png" width="190" alt="設定" />
  <img src="docs/screenshots/dark.png" width="190" alt="深色模式" />
</p>

---

## ✨ 功能

| | |
|---|---|
| 🎟 **音樂祭列表** | 進行中／即將到來與過往活動分區，狀態徽章（進行中、N 天後、已結束）、已加入場數、離線可用標記。 |
| 📋 **演出陣容** | 依日期切換，每個舞台的演出一列一場，**點一下就加入行程**，再點一下移除。 |
| 📅 **全日時間軸** | 多舞台甘特圖，5 分鐘一格、今天有紅色「現在」線並自動捲到當下，一鍵跳回現在。 |
| 🗓 **我的行程** | 跨音樂祭、跨日的個人行程；下一場倒數卡、跨舞台**時間衝突警示**、匯出行程圖、加入行事曆（.ics）。 |
| 🔔 **演出提醒** | 演出前自訂分鐘數（1～60 分）推播，音樂祭前 7 天／1 天提醒。透過 Service Worker 觸發，分頁失焦也會跳。 |
| 🔗 **分享行程** | 雲端短網址（雙方連網）或 **QR Code 離線分享**（雙方都不用網路），朋友可一鍵套用或另存。 |
| 🗺 **場地地圖** | 圖片可放大捲動，離線也看得到；一鍵開 Google 地圖導航。 |
| 🎤 **聽過的藝人** | 從行程自動統計看過哪些藝人、看了幾次、跨了幾個音樂祭。 |
| 📡 **真正離線** | App shell 與即將到來的活動資料在第一次開啟時就存進裝置，之後靠 hash 差異更新，過往活動也可手動存離線。詳見 [`docs/OFFLINE.md`](docs/OFFLINE.md)。 |
| 📲 **安裝到主畫面** | Android／桌面 Chrome 直接跳原生安裝；iPhone 顯示 Safari「加入主畫面」教學。 |
| 🌗 **深色模式** | Material Design 3 色票，跟隨系統或手動切換。 |

---

## 📲 使用方式（一般使用者）

1. 用手機瀏覽器打開網站，第一次請先**連上網路開啟一次**，讓資料存進裝置。
2. 依提示「安裝到主畫面」：
   - **iPhone**：Safari → 分享 → 加入主畫面。
   - **Android**：Chrome 會直接跳出「安裝」，或從右上選單「加到主畫面」。
3. 在「音樂祭」挑活動，點演出加入行程；「行程」頁看自己的時間軸。
4. 到「設定 → 通知設定」允許推播，演出前就會收到提醒。
5. 現場沒訊號也沒關係：行程、時間表、地圖都在裝置裡。

---

## 🚀 開發

```bash
git clone https://github.com/littlechintw/Music-Festival-Timeline.git
cd Music-Festival-Timeline
npm install
npm run dev          # http://localhost:5173（dev 模式不註冊 Service Worker）
```

測 PWA／離線行為要用正式 build：

```bash
npm run build && npm run preview   # http://localhost:4173
```

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發伺服器（會先自動執行 `build:festivals`） |
| `npm run build` | 正式 build，輸出到 `dist/`，含 Service Worker 與 precache manifest |
| `npm run preview` | 預覽 `dist/` |
| `npm run build:festivals` | 把 `festivals/*.json` 同步到 `public/festivals/` 並產生 `index.json`（hash、大小、upcoming/archived） |
| `npm run validate:festivals` | 用 Zod schema 驗證所有節慶 JSON |
| `npm run lint` / `npm test` / `npm run typecheck` | ESLint／Vitest／vue-tsc |
| `npm run check` | lint + test + build，送 PR 前跑 |

### 環境變數（都是選填）

複製 `.env.example` 為 `.env`：

| 變數 | 用途 |
|------|------|
| `VITE_GAS_URL` | 覆寫短網址服務（Google Apps Script）端點。預設已內建公開部署，平常不用填。 |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4。沒設就完全不載入；使用者也可在設定頁關閉。 |

---

## 📂 專案結構

```
festivals/                 音樂祭原始資料（PR 從這裡進來）→ docs/FESTIVAL_FORMAT.md
public/festivals/          build 時產生的執行期資料（gitignore）
scripts/
  build-festival-index.mjs 產生 index.json（hash / bytes / status）
  validate-festivals.mjs   Zod 驗證
  generate-md3-theme.mjs   由 seed color 產生 src/assets/md3-tokens.css
src/
  App.vue                  外框：頂欄、手機底部導覽、全域 modal / toast
  router/                  路由、頁面標題、捲動還原
  views/
    FestivalList.vue       音樂祭列表（分區、搜尋、排序、安裝提示）
    FestivalDetail.vue     活動資訊＋依日期／舞台的演出清單（點擊加入）
    RunDownTimeline.vue    全日時間軸
    MyPlan.vue             我的行程（時間軸、分享、匯出、行事曆、朋友的分享）
    MyArtists.vue          聽過的藝人統計
    MapView.vue            場地地圖（可放大）
    Settings.vue           顯示／通知／離線資料／隱私／安裝與關於
    RedirectShortUrl.vue   /:shortId 解析分享連結
  editor/                  新增音樂祭 JSON 的編輯器（含 AI Prompt）
  components/
    TimelineGrid.vue       甘特圖（MyPlan / RunDown / 分享預覽共用）
    PageHeader.vue         子頁標題列＋返回鍵（standalone 模式沒有瀏覽器返回鈕）
    FestivalCard.vue       列表卡片
    DayChips.vue           日期切換
    InstallPrompt.vue      安裝到主畫面提示（含 iOS 教學）
    NextUpCard.vue         下一場倒數
    ...Modal / Toast / Confirm / OfflineBanner / UpdatePrompt
  composables/
    useFestivals.js        index.json 抓取、hash 比對、離線下載／移除
    useInstallPrompt.js    beforeinstallprompt / standalone / iOS 判斷
    useTimelineGrid.js     時間格與 grid 樣式計算
    useNowTicker / useOnline / useTheme / useToast / useConfirm / useQrScanner
  stores/                  Pinia：festival / plan / savedPlans / settings / offline / notifications
  pwa/
    sw.js                  Service Worker 原始碼（injectManifest）：precache＋runtime cache＋通知點擊
    schema.js              節慶 JSON 的 Zod schema（瀏覽器與 Node 共用）
    registerSW.js          註冊與「有新版本」提示
    notifications.js       推播（SW 優先，fallback window.Notification）
    periodicSync.js        Periodic Background Sync（Chromium 限定）
  utils/                   格式化、perfId、分享編碼、ics、匯出圖片、提醒排程…
docs/
  OFFLINE.md               離線架構完整說明
  FESTIVAL_FORMAT.md       資料格式與欄位規範
  A11Y.md                  無障礙檢查清單與掃描方式
  screenshots/             README 用的畫面
```

---

## 📡 離線與更新機制（摘要）

1. **Precache**：build 時把 app shell 與 `status === 'upcoming'` 的節慶 JSON 列進 Workbox precache，第一次開啟就全部存好。
2. **Runtime cache**：其他節慶 JSON（過往活動、手動存離線）走 StaleWhileRevalidate；地圖圖片 CacheFirst。
3. **Hash 比對**：`index.json` 帶每份 JSON 的 SHA，client 比對 localStorage 裡的 hash，一樣就完全不打網路。
4. **更新提示**：新版 SW 進入 waiting，畫面顯示「有新版本可用」，使用者按下才切換，不會打斷正在使用的畫面。
5. **降級**：雲端分享、GA 等需要網路的功能離線時自動停用，離線 QR 分享仍可用。

完整細節與邊角情境見 [`docs/OFFLINE.md`](docs/OFFLINE.md)。

---

## ♿ 無障礙與色彩

- 主要互動（加入／移除演出、切換日期、時間軸方塊）都能用鍵盤操作，有可見的焦點框與 `aria-pressed` 狀態。
- 狀態不只靠顏色：已加入的演出有勾號、進行中有「LIVE」文字、時間衝突有 ⚠ 圖示與文字說明。主色系為藍／靛，在紅綠色盲模擬下仍可分辨。
- 「演出陣容」清單是時間軸甘特圖的文字版替代，螢幕閱讀器可逐場朗讀藝人、舞台、時間。
- 尊重 `prefers-reduced-motion`（團名跑馬燈會停用改為截斷），提供亮／暗主題。
- 每次改 UI 建議跑一次 axe（`docs/A11Y.md` 有腳本說明）並用 Chromium 的視覺缺陷模擬檢查。

---

## 🚢 部署

`main` 分支 push 後 GitHub Actions（`.github/workflows/deploy.yml`）會 build 並部署到 GitHub Pages，`public/CNAME` 是自訂網域。
節慶 JSON 變動時 `publish-data.yml` 會驗證並把 `index.json` 同步到 `data-live` 分支；PR 由 `validate-pr.yml`（資料）與 `ci.yml`（lint／test／build）檢查。

---

## 🤝 貢獻

- **新增／更正音樂祭時間表**：不需要會寫程式，流程見 [`CONTRIBUTING.md`](CONTRIBUTING.md)，欄位規範見 [`docs/FESTIVAL_FORMAT.md`](docs/FESTIVAL_FORMAT.md)。
- **程式碼**：歡迎 issue 與 PR，送出前請跑 `npm run check`。

提交 PR 即代表您同意本專案的雙授權模式。

## ⚖️ License

**Dual-License（雙授權）**：個人非商用免費（CC BY-NC 4.0，需標注作者）；商用需另外洽談授權。

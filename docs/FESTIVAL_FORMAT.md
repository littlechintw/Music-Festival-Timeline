# 音樂祭資料格式 / Festival JSON Format

每一場音樂祭是 `festivals/` 底下的一個 JSON 檔，檔名建議跟 `festivalId` 一樣（例如 `megaport-2026.json`）。
Schema 的唯一來源是 [`src/pwa/schema.js`](../src/pwa/schema.js)（Zod），瀏覽器載入資料與 CI 驗證都用同一份。

> 最省力的做法：打開 App 的「設定 → 新增音樂祭」（`/editor`），把官方時間表圖片連同內建 Prompt 丟給支援圖片的 AI，
> 產生 JSON 後再貼回編輯器驗證、匯出。

## 最小範例

```json
{
  "festivalId": "example-fest-2026",
  "name": "範例音樂祭 Example Fest 2026",
  "startTime": "2026-10-03T12:00:00+08:00",
  "endTime": "2026-10-04T22:00:00+08:00",
  "location": {
    "name": "臺北流行音樂中心",
    "address": "臺北市南港區市民大道八段99號",
    "latitude": 25.0499,
    "longitude": 121.6122
  },
  "theme": { "primary": "#FF6600", "secondary": "#000000" },
  "stages": [
    {
      "id": "main-stage",
      "name": "主舞台",
      "performances": [
        { "artist": "某某樂團", "start": "2026-10-03T12:00:00+08:00", "end": "2026-10-03T12:40:00+08:00" },
        { "artist": "某某歌手", "start": "2026-10-03T13:00:00+08:00", "end": "2026-10-03T13:40:00+08:00", "description": "特別來賓" }
      ]
    }
  ],
  "map": { "image": "data:image/png;base64,....", "notes": [] },
  "contributors": ["your-github-id"]
}
```

## 欄位說明

| 欄位 | 型別 | 必填 | 說明 |
|------|------|:---:|------|
| `festivalId` | string | ✅ | 只能用小寫英文、數字、`-`。**請包含年份**（如 `megaport-2026`），同一活動每年一份。分享連結與行程都用它當 key，上線後不要改。 |
| `name` | string | ✅ | 顯示名稱，建議中英並列。 |
| `startTime` / `endTime` | ISO 8601 | ✅ | 整個活動的起訖，**必須含時區**（台灣用 `+08:00`）。`endTime` 過了 3 天後會被標成 archived，不再預先快取。 |
| `location.name` | string | ✅ | 場地名稱。 |
| `location.address` | string | ✅ | 地址；App 會拿它產生 Google 地圖導航連結。 |
| `location.latitude` / `longitude` | number | 選填 | 有的話導航連結會用座標，比地址準。 |
| `theme.primary` / `theme.secondary` | CSS 顏色 | 選填 | 活動主色，列表卡片與詳情頁會用來畫識別色條。 |
| `stages[]` | array | ✅ | 至少一個舞台。**順序 = 時間軸欄位順序**，把主舞台放前面。 |
| `stages[].id` | string | ✅ | 舞台 slug（`main-stage`）。 |
| `stages[].name` | string | ✅ | 顯示名稱。行程比對是用 `name`，上線後改名會讓使用者已加入的行程被判定失效。 |
| `stages[].performances[]` | array | ✅ | 該舞台所有演出，可跨天，App 會自己依日期分組。 |
| `performances[].artist` | string | ✅ | 藝人名。同一藝人多場請用一樣的寫法，「聽過的藝人」統計才會合併。 |
| `performances[].start` / `end` | ISO 8601 | ✅ | 含時區。時間軸以 5 分鐘為一格，時間請對齊到 5 分鐘。 |
| `performances[].description` | string | 選填 | 備註，例如「合作演出」「DJ set」。 |
| `map.image` | string | 選填 | 場地地圖。可以是 base64 data URL（離線最保險，建議 ≤ 1.5 MB）或圖片網址（SW 會在第一次開啟時快取）。 |
| `map.notes` | array | 選填 | 保留欄位，目前 UI 未使用。 |
| `contributors` | string[] | 選填 | 貢獻者 GitHub 帳號。 |

## 驗證

```bash
npm run validate:festivals   # Zod schema 驗證所有 festivals/*.json，失敗會列出欄位
npm run build:festivals      # 同步到 public/festivals/ 並產生 index.json（含 hash、大小、狀態）
```

PR 一開 CI 就會自動跑 `validate:festivals`，不過本地先跑一次可以少來回一趟。

## 常見錯誤

- **時間沒帶時區**：`2026-10-03T12:00:00` 會被 schema 擋下。要寫 `2026-10-03T12:00:00+08:00`。
- **`festivalId` 有大寫或底線**：只允許 `[a-z0-9-]`。
- **同一藝人兩種寫法**：`滅火器` 與 `滅火器 Fire EX.` 會被視為不同藝人。`src/data/artistAliases.js` 可以補別名，但一開始就統一最好。
- **地圖圖片太大**：4 MB 的 base64 會讓 JSON 變 5 MB 以上，每個使用者第一次都要下載。壓成 1500px 寬的 JPEG／WebP 通常就夠清楚。

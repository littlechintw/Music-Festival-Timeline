# 貢獻指南 / Contributing

感謝你願意幫忙！這個專案最需要的兩種貢獻是：**新增或更正音樂祭時間表**，以及 **App 本身的修正與改進**。

## 一、新增／更新音樂祭時間表（不需要會寫程式）

1. Fork 這個 repo。
2. 打開 App 的「設定 → 新增音樂祭」（或直接到 `/editor`），用內建的 AI Prompt 把時間表圖片轉成 JSON，或手動填寫。
3. 匯出的 JSON 放到 `festivals/<festivalId>.json`。欄位規範見 [`docs/FESTIVAL_FORMAT.md`](docs/FESTIVAL_FORMAT.md)。
4. 本地驗證（可略過，CI 也會跑）：
   ```bash
   npm install
   npm run validate:festivals
   ```
5. 送 PR，標題寫活動名稱與年份，例如 `Add Megaport Festival 2026`。
6. 合併後 GitHub Actions 會自動重新 build 並部署，`data-live` 分支也會同步更新。

更正既有資料（時間異動、加場、取消）也是同一流程：直接改對應的 JSON 即可。使用者下次開啟 App 時會依 hash 偵測到更新，已排入但時間變動的場次會跳出「行程更新通知」。

## 二、程式碼貢獻

### 環境

- Node.js 20 以上（CI 用 24）
- `npm install` 後：
  | 指令 | 用途 |
  |------|------|
  | `npm run dev` | 開發伺服器（不註冊 Service Worker，避免跟 HMR 打架） |
  | `npm run build` / `npm run preview` | 正式 build＋本機預覽。**測 PWA／離線行為請用這組** |
  | `npm run lint` | ESLint |
  | `npm test` | Vitest 單元測試 |
  | `npm run typecheck` | vue-tsc（JSDoc 型別檢查） |
  | `npm run check` | lint + test + build，送 PR 前跑這個 |

### 慣例

- `<script setup>` + Pinia setup store，JS 加 `// @ts-check` 與 JSDoc 型別。
- UI 顏色一律用 MD3 token（`var(--md-sys-color-*)`），不要寫死色碼，深色模式才會跟著對。
- 圖示從 `src/utils/icons.js` 加一行 import，不要整包字型載進來（離線 precache 預算）。
- 任何會影響離線行為的改動，請對照 [`docs/OFFLINE.md`](docs/OFFLINE.md) 更新文件。
- 手機優先：主要操作要在單手拇指範圍內、可點區域至少 44px、不要依賴 hover。
- 無障礙：新的可點元素要能鍵盤操作、icon-only 按鈕要有 `aria-label`、狀態不能只靠顏色。送 PR 前照 [`docs/A11Y.md`](docs/A11Y.md) 過一遍。

### 測試 PWA

```bash
npm run build && npm run preview
```

打開 http://localhost:4173，DevTools → Application → Service Workers 確認已安裝；Network 切 Offline 後重整，所有頁面（除了雲端分享）都應該還能用。

## 授權

提交 PR 即代表你同意本專案的雙授權模式（個人非商用 CC BY-NC 4.0；商用需另洽）。

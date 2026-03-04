# 🎵 Music Festival Timeline 音樂祭行程助手

<div align="center">
  A modern web app for music festival lovers to track, plan, and share their event itineraries.
  <br>
  專為音樂祭愛好者打造的現代化網頁工具，輕鬆追蹤、規劃與分享你的專屬行程。
</div>

---

## ✨ Features / 核心功能

- 🎟 **Festival Catalog | 音樂祭列表**
  - Browse upcoming and past music festivals, sorted by date or name.
  - 瀏覽即將到來或過往的音樂祭，支援日期與名稱搜尋及排序。
  
- 📅 **Interactive Timetable | 互動式時間軸**
  - A visual, grid-based rundown of all stages and performances.
  - 具備直覺的網格視覺化全日時間軸，各舞台與演出時間一目了然。

- 📝 **Personal Plan Builder & Smart Reminders | 個人行程規劃與智慧提醒**
  - Add favorite artists to "My Plan", run fully offline, and get browser notifications (10 min & 3 min before showtime, and 7/1 days before the festival starts).
  - 支援 PWA 離線使用，加入喜愛的演出不僅可客製化個人時間表，還會在「演出前 10 分鐘、3 分鐘」以及「音樂祭開始前 7 天、1 天」主動推播通知！

- 🔗 **Share Your Plan | 快速分享行程**
  - Generate a compact short URL to share your custom itinerary with friends. They can preview and import it with one click!
  - 將個人的專屬行程產生為短網址，一鍵分享給朋友無縫匯入及預覽！
  - 💡 *URL Shortener powered by / 短網址服務基於：[Short-Text-Tool](https://github.com/littlechintw/Short-Text-Tool)*

- ⚙️ **Customizations | 偏好設定**
  - Toggle between 12-hour and 24-hour time formats, manage local cache, and PWA offline behavior.
  - 支援全站時間格式切換（12 小時制 / 24 小時制），具備本機快取管理等設定。

---

## 🚀 Getting Started / 快速開始

### Prerequisites / 環境要求
- Node.js (v16+)
- npm or pnpm

### Installation / 安裝步驟

```bash
# 1. Clone the repository
git clone https://github.com/littlechintw/Music-Festival-Timeline.git

# 2. Go to project directory
cd Music-Festival-Timeline

# 3. Install dependencies
npm install

# 4. Starting development server
npm run dev
```
Visit `http://localhost:5173` to see the app! (開啟網址預覽專案)

> **Note**: For sharing URLs to work locally, you'll need to set up `VITE_GAS_URL` in your `.env` file pointing to your Google Apps Script endpoint.
> (若要在本機環境測試分享行程的短網址功能，需在 `.env` 中設定 `VITE_GAS_URL`)

---

## 🤝 Contributing / 貢獻指南

We welcome Pull Requests! Whether you want to add new festival data (JSON), fix bugs, or propose a new feature, your contributions are highly appreciated!

我們非常歡迎大家提交 PR（Pull Request）！不管是新增最近的音樂祭 JSON 資料、修復 Bug、還是幫忙優化新功能都非常歡迎。

### ⚠️ Important Notice / PR 注意事項
**By submitting a Pull Request, you acknowledge and agree that your contributions will be licensed under the project's dual-license model.**  
如果您提交了 PR，即代表您知悉並同意您所貢獻的程式碼與資料，將同樣受到本專案的「雙授權模式（Dual-License）」條款約束。

---

## ⚖️ License / 授權條款

This project operates under a **Dual-License (雙授權)** model:  
本專案採用 **雙授權模式**，細則如下：

### 1. Personal & Non-Commercial Use / 個人與非商業用途 (CC BY-NC 4.0)
You are free to use, modify, and share this software for non-commercial purposes, provided you give proper attribution.
✅ **大家可以免費用（非商用）**
- **Attribution Required (需標記作者)**: You must give appropriate credit to the original author.（必需清楚標示原作者與來源。）
- **Non-Commercial (非商業性)**: You may not use this material for any commercial purposes.（嚴禁將原始碼、網站內容直接或間接用於任何營利行為。）

### 2. Commercial Use / 商業用途
If you wish to use this software, its source code, or integrated features in a commercial product, corporate environment, or any revenue-generating context, you **cannot** use the free tier.
❌ **公司或組織不能免費使用此工具來賺錢**
💰 **商業用途要付費**
- **Commercial License Required**: You must purchase/obtain a commercial license to bypass the non-commercial restrictions.
- 如有商業授權需求（如：整合進企業產品、建立商業音樂祭 App 等），請直接與作者聯繫洽談商業授權。

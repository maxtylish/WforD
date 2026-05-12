# 下一餐吃什麼 — 設定教學

## 快速啟動

```bash
# 1. 安裝依賴
npm install

# 2. 複製環境變數範例
cp .env.local.example .env.local

# 3. 填入 API Keys（見下方教學）
# 編輯 .env.local

# 4. 啟動開發伺服器
npm run dev
# → 開啟 http://localhost:3000
```

---

## Step 1 — 申請 Google Maps API Key

### 1-1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點選左上角 **「選取專案」→「新增專案」**
3. 專案名稱輸入 `下一餐吃什麼`，按建立

### 1-2. 啟用所需 API

前往 [API 程式庫](https://console.cloud.google.com/apis/library)，搜尋並啟用以下三個 API：

| API 名稱 | 用途 |
|---------|------|
| **Maps JavaScript API** | 地圖顯示 |
| **Places API** | 餐廳搜尋、評分資料 |
| **Geocoding API** | 地址轉座標（選用）|

### 1-3. 建立 API Key

1. 前往 **API 和服務 → 憑證 → 建立憑證 → API 金鑰**
2. 複製金鑰
3. 點選「限制金鑰」→ 應用程式限制選 **HTTP 參照網址**
4. 加入 `http://localhost:3000/*`（開發用）和你的正式網域

### 1-4. 填入 .env.local

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...你的金鑰...
```

> ⚠️ 免費額度：每月前 $200 美元免費（約 28,000 次地圖載入 + 5,000 次 Places 搜尋）。個人使用遠低於此限制。

---

## Step 2 — 建立 Supabase 資料庫

### 2-1. 建立 Supabase 專案

1. 前往 [supabase.com](https://supabase.com/) → **Start your project**
2. 用 GitHub 登入（免費方案）
3. 點選 **New Project**
4. 填入專案名稱 `next-meal`、資料庫密碼（記下來）、地區選 **Northeast Asia (Tokyo)**

### 2-2. 建立資料表

1. 進入專案後，點選左側 **SQL Editor**
2. 點選 **New Query**
3. 複製 `supabase/schema.sql` 全部內容貼上
4. 點選 **Run** 執行

### 2-3. 取得連線資訊

1. 前往 **Project Settings → API**
2. 複製以下兩個值：
   - **Project URL**（`https://xxxx.supabase.co`）
   - **anon public** key

### 2-4. 填入 .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的專案ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...你的金鑰...
```

---

## Step 3 — 部署到 Vercel（選用，支援跨裝置存取）

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel

# 設定環境變數（在 vercel.com 專案設定中加入）
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

部署後取得 `https://你的app.vercel.app`，手機瀏覽器開啟即可使用！

### 手機加到主畫面 (PWA)

- **iPhone**: Safari 開啟網址 → 分享 → 加入主畫面
- **Android**: Chrome 開啟網址 → 右上角 ⋮ → 新增至主畫面

---

## 功能說明

| 功能 | 說明 |
|------|------|
| 🗺️ 地圖搜尋 | 搜尋附近餐廳，顯示 Google 評分、開放狀態 |
| 🍜 類型篩選 | 中式、日式、韓式、義大利麵、百貨公司等 11 種類型 |
| ⭐ 評分篩選 | 篩選 4.0+ 或 4.5+ 評分餐廳 |
| 🅿️ 停車資訊 | 標示自有停車場（綠色）或附近停車距離（藍色）|
| 🧭 一鍵導航 | 點選「導航」直接開啟 Google Maps 路線規劃 |
| 📝 去過紀錄 | 記錄用餐日期、個人評分（1-5 星）、心得筆記 |
| ☁️ 跨裝置同步 | Supabase 雲端資料庫，手機電腦同步 |
| 📍 定位功能 | 點選定位鈕，地圖移至目前位置搜尋 |

---

## 沒有 API Key 時的 Demo 模式

未設定 Google Maps API Key 時，系統會自動切換為 **Demo 模式**：
- 顯示 8 間台中示範餐廳資料
- 地圖顯示為提示畫面（需要 API Key）
- 「去過紀錄」功能使用本機 LocalStorage 儲存
- 設定 Supabase 後可升級為雲端同步

---

## 常見問題

**Q: Google Maps 顯示「This page can't load Google Maps correctly」**
A: 確認 API Key 正確，且已啟用 Maps JavaScript API 和 Places API

**Q: 搜尋餐廳沒有結果**
A: 確認 Places API 已啟用，且帳號已設定付款方式（免費額度足夠個人使用）

**Q: Supabase 連線失敗**
A: 確認 .env.local 中的 URL 和 Key 正確，且已執行 schema.sql

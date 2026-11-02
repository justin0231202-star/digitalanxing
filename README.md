# digitalanxing · 萌伴教室

Cloudflare Pages 部署入口，目標網址：`digitalanxing.pages.dev`。

## 用手機連接 Cloudflare

1. 登入 https://dash.cloudflare.com/ ，開啟 **Workers & Pages → Create application → Pages → Connect to Git**。
2. 連接 GitHub，授權此儲存庫，選擇 `justin0231202-star/digitalanxing`。
3. 使用以下設定：

| 欄位 | 值 |
| --- | --- |
| Project name | `digitalanxing` |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `public` |
| Root directory | 保持預設 |

4. 選擇 **Save and Deploy**。名稱是否可用，以 Cloudflare 回覆為準。
5. 部署後測試登入、讀取班級、記分、兌換、排行榜與登出。

## 架構與資料

`public/_worker.js` 是 Pages 的進階模式入口，將請求轉送到原本已公開的萌伴教室服務。它不是資料庫遷移，也不是把瀏覽器重新導向舊網址。老師帳號和班級資料仍存於原服務，因此原服務必須持續運作。新的 Pages 網域第一次需要重新登入。

所有帳號、密碼與學生資料均不包含在本儲存庫內。網站代理僅傳遞萌伴教室的老師登入 Cookie；移除偽造的身分標頭與其他 Cookie；阻擋跨來源寫入；不快取老師頁面與資料。原有 ChatGPT 舊教室轉入流程需回原網站處理。

## 驗證

`npm test` 會檢查 Cookie 隔離、跨來源寫入、固定上游與重新導向。正式 Pages 網站尚須在完成 Cloudflare 部署後進行端到端驗證。

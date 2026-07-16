# 莊子全解（Zhuangzi Atlas）

> 原典・白話・哲學・人生智慧  
> 目標：中文世界可出版、可檢索、可擴充的《莊子》數位知識庫。

## 目前版本：V0.2（內篇進行中）

已具備：

- Next.js 靜態網站（首頁／目錄／篇章／搜尋／地圖／百科／莊子 AI）
- 33 篇 + 導論 Markdown 範本（出版級 17 節結構）
- 〈逍遙遊〉第一篇實質 draft
- 電子書合併腳本（Pandoc → EPUB／PDF）
- 靜態 RAG「莊子 AI」（引用本庫內容回答）
- `AGENTS.md` 與寫作提示詞
- GitHub Actions：建置網站並部署 GitHub Pages

## 快速開始

```bash
npm install
npx tsx scripts/scaffold-content.ts   # 若篇章尚未生成
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 常用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 本機預覽 |
| `npm run build` | 靜態匯出至 `out/` |
| `npm run content:validate` | 檢查篇章結構 |
| `npm run indexes:build` | 產生索引 JSON |
| `npm run ebook:md` | 合併全書 Markdown |
| `npm run ebook:epub` | 需安裝 [Pandoc](https://pandoc.org/) |

## 目錄結構

```text
content/
  chapters/     # 導論 + 內外雜篇
  figures/      # 人物百科
  terms/        # 名詞百科
  themes/       # 主題閱讀
  maps/         # 思想地圖
  references/   # 書目
src/
  app/          # 網站頁面
  lib/catalog.ts # 篇章目錄（單一真相來源）
prompts/        # AI 寫作模板
scripts/        # scaffold／ebook／validate
```

## 版本路線

1. **V0.1** 骨架 ✅
2. **V0.2** 導論 + 內篇（進行中：〈逍遙遊〉draft）
3. **V0.3** 外篇
4. **V0.4** 雜篇
5. **V1.0** 出版版

## 部署

### Vercel

匯入本 repo，Framework Preset: Next.js，建置指令 `npm run build`，輸出目錄 `out`（因 `output: "export"`）。

### GitHub Pages

推送至 `main` 後，Actions workflow `deploy.yml` 會建置並部署。若站點不在根網域，請在 `next.config.ts` 設定 `basePath`。

## 本機 LLM（不需雲端 API）

1. 安裝 [Ollama](https://ollama.com/download)
2. `ollama pull qwen2.5:3b`
3. `npm run ai:serve`（本機橋接服務，port 8787）
4. `npm run dev` → 開啟「莊子 AI」→ 選「本機 LLM」

命令列也可直接問：

```bash
npm run ai:ask -- 什麼是無待？
```

回答一律先檢索本庫內容，再交本機模型改寫；沒有 API Key，資料也不上傳。


## 授權

內容與程式碼授權待專案擁有者決定；引用《莊子》原典請依公版文獻慣例標明版本。

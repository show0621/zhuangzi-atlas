# 莊子全解（Zhuangzi Atlas）

> 原典・白話・哲學・人生智慧  
> 目標：中文世界可出版、可檢索、可擴充的《莊子》數位知識庫。

## 目前版本：V1.0（審定／出版稿）

全書三十三篇（導論＋內外雜篇）已達 `published` 狀態，網站版本號 `1.0.0`。

已具備：

- 導論 + 內／外／雜篇 **34 篇完整 17 節 draft**
- 思想地圖、人物／名詞／主題百科
- Next.js 網站 + **Streamlit 手機版**
- 電子書合併、靜態 RAG、本機 Ollama 接口
- GitHub Actions → GitHub Pages

## 山上沉浸閱讀（微風・清水・玻璃書頁）

打開：

```bash
npm run dev
```

前往 [http://localhost:3000/immersive/](http://localhost:3000/immersive/)

特色：霧面玻璃書頁、微風粒子、可開關風聲、節與節淡入淡出、光球游標點亮文字。


內容與 Next 網站共用 `content/`。Streamlit 較適合手機瀏覽與本機互動。

```bash
pip install -r requirements-streamlit.txt
streamlit run streamlit_app/Home.py
```

手機同一區網可開：終端會顯示 `Network URL`（例如 `http://192.168.x.x:8501`）。  
手機瀏覽器打開該網址即可；點左上角 **≡** 切換頁面。

頁面包含：首頁、目錄、閱讀（分段摺疊）、搜尋、莊子 AI、地圖／百科。


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

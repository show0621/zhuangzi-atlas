# 莊子全解 — 印刷成冊說明

## 檔案

| 檔案 | 用途 |
|------|------|
| `zhuangzi-atlas-print.html` | **推薦**：用瀏覽器開啟 →「列印」→「另存為 PDF」→ 拿到影印店 |
| `zhuangzi-atlas-print.md` | 完整 Markdown 原稿（可用 Typora／VS Code／pandoc 再開） |
| `zhuangzi-atlas-print.pdf` | 若本機有 pandoc + XeLaTeX 才會自動產生 |

## 影印店成冊建議

1. 用 Chrome／Edge 開啟 `zhuangzi-atlas-print.html`。
2. `Ctrl+P`（或點頁頂「列印／另存 PDF」）。
3. 目的地選「另存為 PDF」；紙張 **A4**；版面直向。
4. 邊界選「預設」或「最小」均可（HTML 已內建較寬左側裝訂邊）。
5. 帶到影印店：單面或雙面列印後膠裝／騎馬釘；若單面膠裝，請要求**左側裝訂**。

## 本機用 pandoc 產 PDF（可選）

```bash
pandoc public/downloads/zhuangzi-atlas-print.md -o public/downloads/zhuangzi-atlas-print.pdf \
  --pdf-engine=xelatex \
  -V CJKmainfont="Noto Serif CJK TC" \
  -V geometry:margin=2cm \
  -V geometry:left=2.6cm \
  --toc --toc-depth=2
```

若無 XeLaTeX，也可只帶 HTML／Markdown 去店裡請店員轉 PDF。

## 重新產生

在專案根目錄執行：

```bash
npm run ebook:print
```

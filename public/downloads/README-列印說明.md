# 莊子全解 — 印刷成冊說明

> 內容狀態：0.3.0 **draft**（尚未達 review／published）。上機前請先完成編輯審定與 ISBN。

## 檔案

| 檔案 | 用途 |
|------|------|
| `zhuangzi-atlas-print.pdf` | **推薦**：菊16開（148×210 mm） 完整書 PDF（頁碼自「自序」=1） |
| `莊子全解-印刷版.pdf` | 同上（中文檔名別名） |
| `zhuangzi-atlas-cover-wrap.pdf` | 封面展開上機稿（勒口＋封底＋書脊＋封面＋勒口） |
| `zhuangzi-atlas-print.docx` | Word 成冊版（可編輯；頁碼規則以 PDF 為準） |
| `莊子全解-印刷版.docx` | Word 中文檔名別名 |
| `zhuangzi-atlas-print.html` | 瀏覽器預覽；正式頁碼請用已產出的 PDF |
| `zhuangzi-atlas-print.md` | 完整 Markdown 原稿 |

## 成冊建議（菊16開膠裝）

1. 內文：下載 `zhuangzi-atlas-print.pdf`，紙張 **148×210 mm（菊16開）**，左側裝訂。
2. 封面：下載 `zhuangzi-atlas-cover-wrap.pdf`，列印選「實際大小」，含 3mm 出血。
3. 書脊寬度請以實際頁數＋印廠紙樣複核（設計預設見書脊 PDF 說明頁）。

## 重新產生

```bash
npm run ebook:print      # HTML + Markdown
npm run ebook:pdf        # 菊16開 PDF（需 Chrome／Edge）
npm run ebook:docx       # Word
npm run ebook:print:all  # HTML + PDF + Word + 裝訂／書脊／封面展開
```

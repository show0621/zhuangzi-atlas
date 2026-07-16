# 莊子全解 — 印刷成冊說明

## 檔案

| 檔案 | 用途 |
|------|------|
| `zhuangzi-atlas-print.pdf` | **推薦**：A4 完整書 PDF，可直接下載帶到影印店 |
| `莊子全解-印刷版.pdf` | 同上（中文檔名別名） |
| `zhuangzi-atlas-print.docx` | Word 成冊版（可編輯後再列印） |
| `莊子全解-印刷版.docx` | Word 中文檔名別名 |
| `zhuangzi-atlas-print.html` | 用瀏覽器開啟 →「列印」→「另存為 PDF」 |
| `zhuangzi-atlas-print.md` | 完整 Markdown 原稿（可用 Typora／VS Code／pandoc 再開） |

## 影印店成冊建議

1. 下載 `zhuangzi-atlas-print.pdf`（或網站「下載完整書 PDF」）；若需改字可下 Word。
2. 紙張 **A4**；版面直向；左側已預留裝訂邊。
3. 帶到影印店：單面或雙面列印後膠裝／騎馬釘；若單面膠裝，請要求**左側裝訂**。

## 重新產生

在專案根目錄執行：

```bash
npm run ebook:print      # HTML + Markdown
npm run ebook:pdf        # 從 HTML 產 A4 PDF（需 Chrome／Edge）
npm run ebook:docx       # 從 HTML 產 Word（.docx）
npm run ebook:print:all  # HTML + PDF + Word
```

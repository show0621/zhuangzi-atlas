# 莊子全解 — 印刷成冊說明

> 內容狀態：1.0.0 **draft**（尚未達 review／published）。上機前請先完成編輯審定與 ISBN。

## 檔案

| 檔案 | 用途 |
|------|------|
| `zhuangzi-atlas-print.pdf` | **推薦**：菊16開（148×210 mm） 完整書 PDF（頁碼自「自序」=1） |
| `莊子全解-印刷版.pdf` | 同上（中文檔名別名） |
| `zhuangzi-atlas-cover-wrap.pdf` | **上機用**：封面展開（勒口＋封底＋書脊＋封面＋勒口）；第 2 頁為單本數位規格說明 |
| `zhuangzi-atlas-spine.pdf` | 書脊條 1:1＋規格說明（核對中縫寬） |
| `zhuangzi-atlas-cover.docx` 等 | 封面／封底／折頁／展開**示意 Word**（非正式裁切；上機用 PDF） |
| `zhuangzi-atlas-print.docx` | Word 成冊版（可編輯；頁碼規則以 PDF 為準） |
| `莊子全解-印刷版.docx` | Word 中文檔名別名 |
| `zhuangzi-atlas-print.html` | 瀏覽器預覽；正式頁碼請用已產出的 PDF |
| `zhuangzi-atlas-print.md` | 完整 Markdown 原稿 |

## 單本數位｜建議工藝

1. **裝訂**：平裝膠裝＋雙折口書衣（內書皮可用 250g 象牙卡等厚卡；外書衣印展開圖並摺成勒口）。
2. **外書衣紙**：米色新浪潮（或同級微粗糙米色美術紙）。**不要上亮膜／霧膜**。
3. **書名「霧沙金」**：首選數位燙消光金／霧金；備案為數位直印模擬沙金。單本不必開傳統鋅版。
4. **頁數**：目前設計依約 **450 頁**（非舊估 355 頁）；下單前以最新 PDF 頁腳為準。
5. **書脊／勒口（本檔預設）**：書脊 **32 mm**（450 頁／80g 米色輕質估）；勒口各 **90 mm**（厚書建議 80–100 mm）。改紙重請印廠紙樣複核後另出檔。

## 成冊步驟（菊16開）

1. 內文：下載 `zhuangzi-atlas-print.pdf`，紙張 **148×210 mm（菊16開）**，左側膠裝。
2. 書衣：下載 `zhuangzi-atlas-cover-wrap.pdf` 第 1 頁，列印選「實際大小」，含 3mm 出血。
3. 書脊寬度請以實際頁數＋印廠紙樣複核（對照見展開／書脊 PDF 說明頁）。

## 詢問印廠可用話術

> 想印單本作品集：菊16開，內文約 450 頁米色紙膠裝；外書衣用米色新浪潮、雙折口；書名希望數位燙霧金（消光金）。請以紙樣複核書脊；本檔書脊先按 32 mm 設計。

## 重新產生

```bash
npm run ebook:print      # HTML + Markdown
npm run ebook:pdf        # 菊16開 PDF（需 Chrome／Edge）
npm run ebook:docx       # Word
npm run ebook:binding    # 裝幀單頁 PDF
npm run ebook:wrap       # 封面展開 PDF
npm run ebook:spine      # 書脊 PDF／Word
npm run ebook:binding-docx  # 裝幀示意 Word
npm run ebook:print:all  # HTML + PDF + Word + 裝訂／書脊／展開／示意 Word
```

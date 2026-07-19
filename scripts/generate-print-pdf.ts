#!/usr/bin/env tsx
/**
 * 從印刷 HTML 產出菊16開（148×210 mm）PDF（膠裝成冊用）。
 *
 * 優先順序：
 *   1. puppeteer-core + 本機 Chrome／Edge（page.pdf）
 *   2. Chrome／Edge headless CLI --print-to-pdf
 *   3. pandoc（若已安裝且有 PDF engine）
 *
 * 頁碼規則：
 *   - 封面／作者折頁／題辭／出版資訊：不編頁
 *   - 「自序」起為第 1 頁；目錄頁碼同步以此重算
 *
 * 目錄頁碼：兩次輸出——先插入隱藏標記並產 PDF，
 * 再用 pdf.js 讀出真實頁碼（扣前頁偏移）寫回目錄，最後蓋章頁碼。
 *
 * 用法：
 *   npm run ebook:pdf
 *
 * 輸出：
 *   - public/downloads/zhuangzi-atlas-print.pdf
 *   - public/downloads/莊子全解-印刷版.pdf（同內容別名）
 *   - dist/ebook/ 同步一份
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { pathToFileURL } from "url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const HTML_NAME = "zhuangzi-atlas-print.html";
const PDF_NAME = "zhuangzi-atlas-print.pdf";
const PDF_ALIAS = "莊子全解-印刷版.pdf";

/** 頁碼起算錨點（與目錄 data-target 一致） */
const PREFACE_TOC_ID = "莊子全解自序";

const PDF_OPTS = {
  // 實際尺寸以 HTML @page（菊16開 148×210）為準
  printBackground: true,
  preferCSSPageSize: true,
  // 頁碼改由 pdf-lib 自「自序」起蓋章；Chrome footer 無法中途重編
  displayHeaderFooter: false,
  margin: { top: "15mm", right: "14mm", bottom: "18mm", left: "20mm" },
};

function resolveHtmlPath(): string {
  const candidates = [
    path.join(PUBLIC_DIR, HTML_NAME),
    path.join(OUT_DIR, HTML_NAME),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`找不到 ${HTML_NAME}。請先執行：npm run ebook:print`);
}

function findBrowser(): string | null {
  const env = process.env.CHROME_PATH || process.env.EDGE_PATH;
  if (env && fs.existsSync(env)) return env;

  const candidates = [
    path.join(process.env["ProgramFiles"] || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["ProgramFiles"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function writeOutputs(pdfBufferOrPath: string | Buffer): string {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const distPdf = path.join(OUT_DIR, PDF_NAME);
  const publicPdf = path.join(PUBLIC_DIR, PDF_NAME);
  const publicAlias = path.join(PUBLIC_DIR, PDF_ALIAS);

  if (Buffer.isBuffer(pdfBufferOrPath)) {
    fs.writeFileSync(distPdf, pdfBufferOrPath);
  } else {
    fs.copyFileSync(pdfBufferOrPath, distPdf);
  }
  fs.copyFileSync(distPdf, publicPdf);
  fs.copyFileSync(distPdf, publicAlias);

  const size = fs.statSync(publicPdf).size;
  console.log(`wrote ${publicPdf} (${(size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`wrote ${publicAlias}`);
  console.log(`wrote ${distPdf}`);
  return publicPdf;
}

/** 從帶標記的 PDF 抽出各 TOC 目標的實體頁碼（1-based，含前頁） */
async function extractTocPagesFromPdf(
  pdfBytes: Uint8Array,
): Promise<Record<string, number>> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const idToPage: Record<string, number> = Object.create(null);

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? String(it.str) : ""))
      .join("");
    const re = /§§toc:([^§]+)§§/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      // Noto CJK 抽出時偶發康熙部首碼位（⼦／⾃）；NFKC 正規化回統一漢字
      const id = m[1].normalize("NFKC");
      if (idToPage[id] == null) idToPage[id] = i;
    }
  }

  return idToPage;
}

/** 實體頁 → 印刷頁碼（自序 = 1）；前頁目標回傳 null */
function toPrintedPage(
  physical: number,
  prefacePhysical: number | undefined,
): number | null {
  if (prefacePhysical == null || prefacePhysical < 1) return physical;
  if (physical < prefacePhysical) return null;
  return physical - prefacePhysical + 1;
}

/** 自序起於頁尾中央蓋阿拉伯數字頁碼 */
async function stampPrintedPageNumbers(
  pdfBytes: Uint8Array,
  prefacePhysical: number,
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const start = Math.max(1, prefacePhysical) - 1;
  for (let i = start; i < pages.length; i += 1) {
    const page = pages[i];
    const { width } = page.getSize();
    const label = String(i - start + 1);
    const size = 9;
    const textWidth = font.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: (width - textWidth) / 2,
      y: 28,
      size,
      font,
      color: rgb(0.33, 0.33, 0.33),
    });
  }
  return Buffer.from(await doc.save());
}

type StrandTarget = { norm: string; ordinal: number };

/** 掃描 PDF：頁末開節且下頁續同節 → 回傳需強制換頁的 h2（norm + 出現序） */
function findBottomStrands(pdfBytes: Buffer | Uint8Array): StrandTarget[] {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmp = path.join(OUT_DIR, `_strand-${Date.now()}.pdf`);
  fs.writeFileSync(tmp, pdfBytes);
  try {
    const script = path.join(process.cwd(), "scripts", "find-bottom-strands.py");
    const result = spawnSync("python3", [script, tmp], {
      encoding: "utf8",
      timeout: 120_000,
    });
    if (result.status !== 0) {
      console.warn("strand 掃描失敗：", (result.stderr || "").slice(0, 300));
      return [];
    }
    const line = (result.stdout || "").trim().split("\n").filter(Boolean).pop() || "[]";
    const parsed = JSON.parse(line) as StrandTarget[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("strand 掃描例外：", err instanceof Error ? err.message : err);
    return [];
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

async function tryPuppeteer(htmlPath: string): Promise<string | null> {
  const browserPath = findBrowser();
  if (!browserPath) {
    console.warn("未找到 Chrome／Edge，略過 puppeteer-core。");
    return null;
  }

  try {
    const puppeteer = await import("puppeteer-core");
    console.log(`使用 puppeteer-core + ${browserPath}`);

    const browser = await puppeteer.default.launch({
      executablePath: browserPath,
      headless: true,
      args: ["--font-render-hinting=none", "--disable-gpu"],
    });

    try {
      const page = await browser.newPage();
      const fileUrl = pathToFileURL(htmlPath).href;
      await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 180_000 });

      await page.evaluate(async () => {
        await (document.fonts?.ready ?? Promise.resolve());
        const imgs = Array.from(document.images);
        await Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.addEventListener("load", () => resolve(), { once: true });
                  img.addEventListener("error", () => resolve(), { once: true });
                }),
          ),
        );
      });

      // 等待 Mermaid 心智圖轉為 SVG（無 mermaid 區塊時立即通過）
      await page
        .waitForFunction(
          () => {
            const nodes = document.querySelectorAll(".mermaid");
            if (nodes.length === 0) return true;
            return Array.from(nodes).every((n) => n.querySelector("svg"));
          },
          { timeout: 120_000 },
        )
        .catch(() => {
          console.warn("Mermaid 渲染逾時，部分心智圖可能仍為原始文字。");
        });

      await new Promise((r) => setTimeout(r, 800));

      // 心智圖 SVG：撐滿版心寬（不設 max-height，避免直向圖被壓成細條）；
      // 不改 viewBox（改 viewBox 會弄亂 foreignObject 中文字）
      await page.evaluate(`(() => {
        document.querySelectorAll(".print-mindmap .mermaid svg").forEach((svg) => {
          const parent = svg.parentElement as HTMLElement | null;
          const cw = parent?.clientWidth || 0;
          svg.removeAttribute("width");
          svg.removeAttribute("height");
          svg.style.display = "block";
          svg.style.marginLeft = "auto";
          svg.style.marginRight = "auto";
          svg.style.maxHeight = "none";
          svg.style.transform = "";
          // 明確以版心寬度設定，避免 Mermaid 內建窄 width 殘留
          if (cw > 0) {
            svg.style.width = cw + "px";
            svg.style.maxWidth = "100%";
            svg.style.height = "auto";
          } else {
            svg.style.width = "100%";
            svg.style.maxWidth = "100%";
            svg.style.height = "auto";
          }
        });
      })()`);

      // 移除書脊殘頁（勿進正文 PDF）
      await page.evaluate(`(() => {
        document.querySelectorAll(".spine-page").forEach((el) => {
          let prev = el.previousElementSibling;
          while (prev && prev.classList.contains("pagebreak")) {
            const p = prev.previousElementSibling;
            prev.remove();
            prev = p;
          }
          el.remove();
        });
      })()`);

      // 頁末懸空節標題：Chrome 常忽略 break-inside，改以強制換頁整組下移
      for (let pass = 1; pass <= 4; pass += 1) {
        const layoutPdf = await page.pdf(PDF_OPTS);
        const strands = findBottomStrands(layoutPdf);
        if (strands.length === 0) {
          if (pass === 1) console.log("頁末懸空節標題：無");
          else console.log(`頁末懸空節標題：第 ${pass - 1} 輪強制換頁後已清零`);
          break;
        }
        console.log(
          `頁末懸空節標題：第 ${pass} 輪強制換頁 ${strands.length} 處` +
            `（例：${strands
              .slice(0, 5)
              .map((s) => s.norm)
              .join("、")}）`,
        );
        const applied = await page.evaluate(`((targets) => {
          const norm = (s) =>
            String(s || "")
              .replace(/[\\s\\u2060\\u200b]+/g, "")
              .normalize("NFKC");
          const counts = Object.create(null);
          let n = 0;
          document.querySelectorAll("h2").forEach((h2) => {
            const key = norm(h2.textContent);
            const ord = counts[key] || 0;
            counts[key] = ord + 1;
            const hit = targets.some((t) => t.norm === key && t.ordinal === ord);
            if (!hit) return;
            const wrap = h2.closest(".print-section-head");
            (wrap || h2).classList.add("print-force-newpage");
            n += 1;
          });
          return n;
        })(${JSON.stringify(strands)})`);
        if (!applied) {
          console.warn("強制換頁未匹配到 DOM 標題，停止迭代。");
          break;
        }
        if (pass === 4) {
          const left = findBottomStrands(await page.pdf(PDF_OPTS));
          if (left.length)
            console.warn(`頁末懸空節標題：仍剩 ${left.length} 處（已達迭代上限）`);
        }
      }

      // 為目錄目標插入可抽取標記
      await page.evaluate(`(() => {
        document.querySelectorAll(".toc-pdf-marker").forEach((el) => el.remove());

        const resolveTarget = (id) => {
          if (id === "cover") return document.querySelector(".cover-page");
          if (id === "作者介紹") return document.querySelector(".author-flap-page");
          if (id === "目錄") {
            return document.getElementById("目錄") || document.getElementById("目錄-wrap");
          }
          return document.getElementById(id);
        };

        document.querySelectorAll(".toc-row[data-target]").forEach((row) => {
          const id = row.getAttribute("data-target") || "";
          if (!id) return;
          const el = resolveTarget(id);
          if (!el) return;
          if (el.querySelector(".toc-pdf-marker")) return;
          const marker = document.createElement("span");
          marker.className = "toc-pdf-marker";
          marker.setAttribute("aria-hidden", "true");
          // 極小但可被 pdf.js 抽出的字元；最終 PDF 會移除
          marker.textContent = "§§toc:" + id + "§§";
          marker.style.cssText =
            "position:absolute;left:0;top:0;font-size:6px;line-height:1;color:rgba(0,0,0,0.01);";
          const cs = window.getComputedStyle(el);
          if (cs.position === "static") el.style.position = "relative";
          el.prepend(marker);
        });
      })()`);

      const probePdf = await page.pdf(PDF_OPTS);
      const physicalPages = await extractTocPagesFromPdf(new Uint8Array(probePdf));
      const prefacePhysical = physicalPages[PREFACE_TOC_ID];
      const printedPages: Record<string, number> = Object.create(null);
      for (const [id, phys] of Object.entries(physicalPages)) {
        const printed = toPrintedPage(phys, prefacePhysical);
        if (printed != null) printedPages[id] = printed;
      }
      console.log(
        `目錄頁碼對照：自 PDF 讀到 ${Object.keys(physicalPages).length} 個目標` +
          (prefacePhysical != null
            ? `；自序實體第 ${prefacePhysical} 頁 → 印刷第 1 頁`
            : "；未找到自序錨點，頁碼未偏移"),
      );
      if (Object.keys(physicalPages).length === 0) {
        console.warn("警告：未能自 PDF 抽出目錄標記，目錄頁碼可能空白。");
      }

      await page.evaluate(`((printedPages) => {
        document.querySelectorAll(".toc-row[data-target]").forEach((row) => {
          const target = row.getAttribute("data-target") || "";
          const span = row.querySelector(".toc-page");
          if (!span) return;
          if (printedPages[target] != null) {
            span.textContent = String(printedPages[target]);
          } else {
            span.textContent = "";
          }
        });
        document.querySelectorAll(".toc-pdf-marker").forEach((el) => el.remove());
      })(${JSON.stringify(printedPages)})`);

      const pdf = await page.pdf(PDF_OPTS);
      const stamped =
        prefacePhysical != null
          ? await stampPrintedPageNumbers(new Uint8Array(pdf), prefacePhysical)
          : Buffer.from(pdf);
      return writeOutputs(stamped);
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.warn("puppeteer-core 失敗：", err instanceof Error ? err.message : err);
    return null;
  }
}

function tryChromeHeadless(htmlPath: string): string | null {
  const browserPath = findBrowser();
  if (!browserPath) {
    console.warn("未找到 Chrome／Edge，略過 headless CLI。");
    return null;
  }

  const tmpPdf = path.join(OUT_DIR, `_tmp-print-${Date.now()}.pdf`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const fileUrl = pathToFileURL(htmlPath).href;

  console.log(`使用 headless CLI：${browserPath}`);
  const result = spawnSync(
    browserPath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${tmpPdf}`,
      fileUrl,
    ],
    { encoding: "utf8", timeout: 300_000 },
  );

  if (result.error) {
    console.warn("headless CLI 啟動失敗：", result.error.message);
    return null;
  }
  if (result.status !== 0 || !fs.existsSync(tmpPdf)) {
    console.warn("headless CLI 失敗：", (result.stderr || result.stdout || "").slice(0, 500));
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
    return null;
  }

  const out = writeOutputs(tmpPdf);
  fs.unlinkSync(tmpPdf);
  return out;
}

function tryPandoc(htmlPath: string): string | null {
  const mdPath = path.join(PUBLIC_DIR, "zhuangzi-atlas-print.md");
  const src = fs.existsSync(mdPath) ? mdPath : htmlPath;
  const tmpPdf = path.join(OUT_DIR, `_tmp-pandoc-${Date.now()}.pdf`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const engines = ["xelatex", "lualatex", "wkhtmltopdf", "weasyprint"];
  for (const engine of engines) {
    console.log(`嘗試 pandoc + ${engine}…`);
    const args =
      engine === "wkhtmltopdf" || engine === "weasyprint"
        ? [src, "-o", tmpPdf, `--pdf-engine=${engine}`]
        : [
            src,
            "-o",
            tmpPdf,
            `--pdf-engine=${engine}`,
            "-V",
            "geometry:margin=2cm",
            "-V",
            "geometry:left=2.6cm",
            "--toc",
            "--toc-depth=2",
            "-f",
            src.endsWith(".html") ? "html" : "markdown",
            "-t",
            "pdf",
          ];

    const result = spawnSync("pandoc", args, { encoding: "utf8" });
    if (result.error) {
      console.warn("Pandoc 未安裝，略過。");
      return null;
    }
    if (result.status === 0 && fs.existsSync(tmpPdf)) {
      const out = writeOutputs(tmpPdf);
      fs.unlinkSync(tmpPdf);
      return out;
    }
  }
  if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
  return null;
}

async function main() {
  const htmlPath = resolveHtmlPath();
  console.log("來源 HTML：", htmlPath);

  const viaPuppeteer = await tryPuppeteer(htmlPath);
  if (viaPuppeteer) {
    console.log("\nPDF 已就緒（puppeteer-core）。");
    return;
  }

  const viaChrome = tryChromeHeadless(htmlPath);
  if (viaChrome) {
    console.log("\nPDF 已就緒（Chrome／Edge headless）。注意：此路徑無法填目錄頁碼。");
    return;
  }

  const viaPandoc = tryPandoc(htmlPath);
  if (viaPandoc) {
    console.log("\nPDF 已就緒（pandoc）。注意：此路徑無法填目錄頁碼。");
    return;
  }

  console.error(
    "無法產生 PDF。請確認已安裝 Chrome／Edge，或安裝 pandoc + XeLaTeX。",
  );
  process.exitCode = 1;
}

main();

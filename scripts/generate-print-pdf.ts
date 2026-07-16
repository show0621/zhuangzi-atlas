#!/usr/bin/env tsx
/**
 * 從印刷 HTML 產出 A4 PDF（影印店成冊用）。
 *
 * 優先順序：
 *   1. puppeteer-core + 本機 Chrome／Edge（page.pdf）
 *   2. Chrome／Edge headless CLI --print-to-pdf
 *   3. pandoc（若已安裝且有 PDF engine）
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

const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const HTML_NAME = "zhuangzi-atlas-print.html";
const PDF_NAME = "zhuangzi-atlas-print.pdf";
const PDF_ALIAS = "莊子全解-印刷版.pdf";

function resolveHtmlPath(): string {
  const candidates = [
    path.join(PUBLIC_DIR, HTML_NAME),
    path.join(OUT_DIR, HTML_NAME),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `找不到 ${HTML_NAME}。請先執行：npm run ebook:print`,
  );
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

      // 等網頁字型（草書）／封面圖穩定
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
      await new Promise((r) => setTimeout(r, 1200));

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      return writeOutputs(Buffer.from(pdf));
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
    console.log("\nPDF 已就緒（Chrome／Edge headless）。");
    return;
  }

  const viaPandoc = tryPandoc(htmlPath);
  if (viaPandoc) {
    console.log("\nPDF 已就緒（pandoc）。");
    return;
  }

  console.error(
    "無法產生 PDF。請確認已安裝 Chrome／Edge，或安裝 pandoc + XeLaTeX。",
  );
  process.exitCode = 1;
}

main();

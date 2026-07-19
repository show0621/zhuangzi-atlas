#!/usr/bin/env python3
"""
交印預檢：轉曲／字型、圖片有效 DPI、RGB/CMYK、出血。

用法：python3 scripts/check-print-press.py
      npm run print:press

本庫 PDF 由 Chrome 產出：預期為「內嵌字型 + RGB + 封面展開含 3mm 出血」。
轉曲與 CMYK 需印廠或後製，不由本腳本「修好」檔案。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "downloads" / "assets"
DOWNLOADS = ROOT / "public" / "downloads"

# (檔名, 列印寬 mm 或 None, 列印高 mm 或 None, 說明)
# 有效 dpi = 像素 / (mm/25.4)
IMAGE_CHECKS: list[tuple[str, float | None, float | None, str]] = [
    ("print-cover-title-cursive-opaque.jpg", 118, None, "內文封面書名"),
    ("print-cover-title-cursive-opaque.jpg", 92, None, "展開封面書名"),
    ("cover-author-wenkai.png", None, 5.6, "內文封面作者"),
    ("cover-author-wenkai.png", None, 4.6, "展開封面作者"),
    ("flap-author-name.png", None, 9.0, "展開前勒口署名"),
    ("epigraph-calligraphy.png", 94, None, "題辭書法"),
    ("afterword-calligraphy.png", 126, None, "後記書法"),
    ("spine-calligraphy.png", 15.5, 192.0, "書脊書法（contain 估）"),
]

MIN_DPI = 300
BLEED_MM = 3.0
WRAP_TRIM_W_MM = 508.0  # 90+148+32+148+90
WRAP_TRIM_H_MM = 210.0
PT_PER_MM = 72 / 25.4


def dpi_for(px: int, mm: float) -> float:
    return px / (mm / 25.4)


def check_images() -> list[str]:
    lines: list[str] = []
    fail = 0
    try:
        from PIL import Image
    except ImportError:
        return ["ERROR: 需要 Pillow（pip install pillow）"]

    lines.append("## 圖片有效解析度（≥300 dpi）")
    for name, w_mm, h_mm, label in IMAGE_CHECKS:
        path = ASSETS / name
        if not path.exists():
            lines.append(f"  ✗ 缺檔 {name}（{label}）")
            fail += 1
            continue
        im = Image.open(path)
        w, h = im.size
        mode = im.mode
        if w_mm and h_mm:
            # 取較嚴的一邊
            d = min(dpi_for(w, w_mm), dpi_for(h, h_mm))
            size_note = f"{w_mm}×{h_mm} mm"
        elif w_mm:
            d = dpi_for(w, w_mm)
            size_note = f"寬 {w_mm} mm"
        else:
            assert h_mm is not None
            d = dpi_for(h, h_mm)
            size_note = f"高 {h_mm} mm"
        ok = d + 0.5 >= MIN_DPI
        mark = "✓" if ok else "✗"
        if not ok:
            fail += 1
        lines.append(
            f"  {mark} {label}: {name} {w}×{h}px ({mode}) @ {size_note} → {d:.0f} dpi"
        )
    lines.append(f"  → 圖片檢查：{'通過' if fail == 0 else f'{fail} 項未達標'}")
    return lines


def pdf_page_size_mm(page) -> tuple[float, float]:
    box = page.mediabox
    w_pt = float(box.width)
    h_pt = float(box.height)
    return w_pt / PT_PER_MM, h_pt / PT_PER_MM


def scan_pdf_bytes(data: bytes) -> dict:
    """粗掃 PDF 字串：色彩空間、字型／路徑跡象。"""
    # 抽樣前 8MB + 尾 2MB，大檔也能判斷
    sample = data[: 8 * 1024 * 1024]
    if len(data) > 10 * 1024 * 1024:
        sample += data[-2 * 1024 * 1024 :]
    text = sample.decode("latin-1", errors="ignore")
    return {
        "has_cmyk": "/DeviceCMYK" in text or "/CMYK" in text,
        "has_rgb_icc": "RGB" in text and ("ICCBased" in text or "/DeviceRGB" in text),
        "has_device_rgb": "/DeviceRGB" in text,
        "font_ops": len(re.findall(r"/Font\b", text)),
        "has_cidfont": "/CIDFont" in text or "/Type0" in text,
        "has_to_unicode": "/ToUnicode" in text,
    }


def page_has_fonts(page) -> bool:
    try:
        res = page.get("/Resources")
        if res is None:
            return False
        res = res.get_object() if hasattr(res, "get_object") else res
        fonts = res.get("/Font") if res else None
        return bool(fonts)
    except Exception:
        return False


def check_pdf(name: str, expect_bleed: bool) -> list[str]:
    lines: list[str] = []
    path = DOWNLOADS / name
    lines.append(f"## PDF：{name}")
    if not path.exists():
        lines.append("  ✗ 檔案不存在")
        return lines

    try:
        from pypdf import PdfReader
    except ImportError:
        lines.append("  ERROR: 需要 pypdf")
        return lines

    data = path.read_bytes()
    reader = PdfReader(path)
    page0 = reader.pages[0]
    w_mm, h_mm = pdf_page_size_mm(page0)
    lines.append(f"  頁數：{len(reader.pages)}；第 1 頁 MediaBox ≈ {w_mm:.1f}×{h_mm:.1f} mm")

    meta = scan_pdf_bytes(data)
    fonts_on_pages = any(page_has_fonts(p) for p in reader.pages[:2])
    extractable = bool((page0.extract_text() or "").strip())

    # 字型／轉曲
    if fonts_on_pages or meta["has_cidfont"] or meta["font_ops"] > 0:
        note = "可抽取文字" if extractable else "含字型物件"
        lines.append(
            f"  · 文字：偵測到內嵌字型（{note}）→ **尚未轉曲**；"
            "數位印刷通常可直接用內嵌字。若廠方要求外框，請 Acrobat／印廠處理。"
        )
    elif extractable:
        lines.append("  · 文字：可抽取文字但字型物件不明（請用 Acrobat 預檢）")
    else:
        lines.append("  · 文字：未偵測到字型／可抽文字（可能已轉曲或純圖）")

    # 色彩
    if meta["has_cmyk"] and not meta["has_rgb_icc"]:
        lines.append("  · 色彩：偵測到 DeviceCMYK")
    elif meta["has_cmyk"]:
        lines.append("  · 色彩：同時有 CMYK 與 RGB 跡象（請用 Acrobat 預檢確認）")
    else:
        lines.append(
            "  · 色彩：**RGB／sRGB 管線**（Chrome PDF 典型）。"
            "單本數位多可接受；膠印若要求 CMYK 請印廠轉檔。"
        )

    # 出血
    if expect_bleed:
        ok_w = abs(w_mm - (WRAP_TRIM_W_MM + BLEED_MM * 2)) < 1.5
        ok_h = abs(h_mm - (WRAP_TRIM_H_MM + BLEED_MM * 2)) < 1.5
        if ok_w and ok_h:
            lines.append(
                f"  ✓ 出血：第 1 頁約為裁切 {WRAP_TRIM_W_MM:.0f}×{WRAP_TRIM_H_MM:.0f} + 四周 {BLEED_MM:.0f} mm"
            )
        else:
            lines.append(
                f"  ✗ 出血：預期約 {WRAP_TRIM_W_MM + BLEED_MM * 2:.0f}×"
                f"{WRAP_TRIM_H_MM + BLEED_MM * 2:.0f} mm，實測 {w_mm:.1f}×{h_mm:.1f} mm"
            )
    else:
        # 內文：成品裁切、邊距當安全區
        ok = abs(w_mm - 148) < 1.5 and abs(h_mm - 210) < 1.5
        if ok:
            lines.append(
                "  · 出血：內文為成品 148×210 mm（無頁面出血）。"
                "膠裝常見做法；版心邊距 ≥14 mm，裁切不易露白。"
            )
        else:
            lines.append(f"  · 尺寸：實測 {w_mm:.1f}×{h_mm:.1f} mm（預期 148×210）")

    return lines


def main() -> int:
    out: list[str] = [
        "# 《莊子全解》交印預檢",
        "",
        "Chrome→PDF 無法在生成時完成「轉曲」與「CMYK」；本報告標示現況與建議。",
        "",
    ]
    out.extend(check_images())
    out.append("")
    out.extend(check_pdf("zhuangzi-atlas-cover-wrap.pdf", expect_bleed=True))
    out.append("")
    out.extend(check_pdf("zhuangzi-atlas-print.pdf", expect_bleed=False))
    out.append("")
    out.append("## 建議對印廠說明")
    out.append("  1. 字型已內嵌；若必須轉曲請廠方或 Acrobat 處理。")
    out.append("  2. 檔案為 RGB；數位機台可直接印，膠印請轉 CMYK。")
    out.append("  3. 封面展開含 3mm 出血；內文為成品尺寸＋安全邊距。")
    out.append("  4. 封面／書法圖有效解析度請見上方（目標 ≥300 dpi）。")
    text = "\n".join(out) + "\n"
    print(text)
    report = DOWNLOADS / "PRESS-PREFLIGHT.txt"
    report.write_text(text, encoding="utf-8")
    print(f"wrote {report.relative_to(ROOT)}", file=sys.stderr)
    # 圖片未達標才非 0；字型／RGB 為預期現況不算失敗
    if "✗" in text and "圖片檢查：通過" not in text:
        return 1
    if re.search(r"圖片檢查：\d+ 項未達標", text):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

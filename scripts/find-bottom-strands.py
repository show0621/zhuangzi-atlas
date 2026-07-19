#!/usr/bin/env python3
"""找出印刷 PDF 中「頁末開節、下頁續同節」的標題，輸出 JSON 供產檔強制換頁。

用法：
  python3 scripts/find-bottom-strands.py [pdf路徑]
stdout：[{"norm":"10.與老子比較","ordinal":0}, ...]
  ordinal = 該正規化標題在全書出現次序（0-based，與 DOM h2 掃描一致）
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import fitz  # pymupdf
except ImportError:
    print("[]")
    sys.stderr.write("pymupdf 未安裝，略過 strand 掃描\n")
    raise SystemExit(0)

PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else (
    Path(__file__).resolve().parents[1] / "public" / "downloads" / "zhuangzi-atlas-print.pdf"
)

Y_RATIO = 0.70
AFTER_MAX = 160


def norm(s: str) -> str:
    return re.sub(r"[\s\u2060\u200b]+", "", s).replace("\u2060", "")


def is_sec(s: str) -> re.Match[str] | None:
    return re.fullmatch(r"(\d{1,2})\.([\u4e00-\u9fff]{2,12})", norm(s))


def main() -> int:
    if not PDF.exists():
        print("[]")
        return 0

    doc = fitz.open(PDF)
    # 全書標題出現次序（所有 02–15 節標題）
    heading_ord: dict[str, int] = {}
    # 每頁最後一個 02–15 標題（若有）
    page_last: list[tuple[str, int, float, int] | None] = []

    for i in range(doc.page_count):
        page = doc[i]
        h = page.rect.height
        blocks = page.get_text("dict")["blocks"]
        headings: list[tuple[float, str, int]] = []
        for b in blocks:
            if b.get("type") != 0:
                continue
            for line in b.get("lines", []):
                text = "".join(s["text"] for s in line["spans"]).strip()
                m = is_sec(text)
                if not m:
                    continue
                num = int(m.group(1))
                if 2 <= num <= 15:
                    n = norm(text)
                    ord_i = heading_ord.get(n, 0)
                    heading_ord[n] = ord_i + 1
                    headings.append((line["bbox"][1], n, ord_i))

        if not headings:
            page_last.append(None)
            continue

        y, n, ord_i = max(headings, key=lambda x: x[0])
        after_parts: list[str] = []
        for b in blocks:
            if b.get("type") != 0:
                continue
            for line in b.get("lines", []):
                if line["bbox"][1] > y + 2:
                    after_parts.append("".join(s["text"] for s in line["spans"]))
        if after_parts and re.fullmatch(r"\d{1,3}", after_parts[-1].strip()):
            after_parts = after_parts[:-1]
        after_n = len(norm("".join(after_parts)))
        page_last.append((n, ord_i, y / h if h else 0, after_n))

    targets: list[dict[str, object]] = []
    seen: set[tuple[str, int]] = set()

    for i, last in enumerate(page_last):
        if last is None:
            continue
        n, ord_i, y_ratio, after_n = last
        if y_ratio < Y_RATIO or after_n >= AFTER_MAX:
            continue
        if i + 1 >= doc.page_count:
            continue
        next_first = ""
        for line in doc[i + 1].get_text("text").splitlines():
            s = line.strip()
            if s and not re.fullmatch(r"\d{1,3}", s):
                next_first = s
                break
        if is_sec(next_first):
            # 下頁已是新節（含 §16）→ 本節已收束，不算跨頁斷裂
            continue
        nf = norm(next_first)
        if nf.startswith("註：") or nf.startswith("閱讀"):
            continue
        key = (n, ord_i)
        if key in seen:
            continue
        seen.add(key)
        targets.append({"norm": n, "ordinal": ord_i})

    doc.close()
    print(json.dumps(targets, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

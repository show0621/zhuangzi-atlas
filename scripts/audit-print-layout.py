#!/usr/bin/env python3
"""掃描印刷 PDF，找出空白頁、標題／圖表跨頁斷裂等排版疑慮。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from pypdf import PdfReader

PDF = Path(__file__).resolve().parents[1] / "public" / "downloads" / "zhuangzi-atlas-print.pdf"

# 前後置：僅圖像、不編頁或頁碼極少屬正常
FRONT_MATTER_IMAGE_PAGES = {3}
BACK_MATTER_IMAGE_PAGES: set[int] = set()


def norm(s: str) -> str:
    return re.sub(r"\s+", "", s.replace("\u2060", ""))


def body_without_page_num(text: str) -> str:
    return re.sub(r"\n?\d{1,3}\s*$", "", text.strip())


def last_line(text: str) -> str | None:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    return norm(lines[-1]) if lines else None


def is_mindmap_heading(line: str | None) -> bool:
    return bool(line and re.search(r"16\.?心智圖", line))


def is_section_heading(line: str | None) -> bool:
    return bool(line and re.fullmatch(r"\d{1,2}\.[\u4e00-\u9fff]{2,12}", line))


def main() -> int:
    if not PDF.exists():
        print(f"找不到 {PDF}，請先執行 npm run ebook:pdf", file=sys.stderr)
        return 2

    reader = PdfReader(str(PDF))
    issues: list[tuple[int, str, str]] = []

    for i, page in enumerate(reader.pages):
        pnum = i + 1
        text = page.extract_text() or ""
        n = norm(text)
        body = norm(body_without_page_num(text))
        last = last_line(text)

        # 空白／近空白頁（排除前後置圖像頁）
        if len(body) < 20 and pnum not in FRONT_MATTER_IMAGE_PAGES | BACK_MATTER_IMAGE_PAGES:
            issues.append((pnum, "blank-page", f"近空白頁（正文 {len(body)} 字）"))

        if is_mindmap_heading(last) and "flowchart" not in n and "→" not in text:
            issues.append((pnum, "orphan-mindmap-heading", "頁末僅見「16.心智圖」，圖表可能在下一頁"))

        if last and is_section_heading(last) and "17.延伸閱讀" not in last:
            issues.append((pnum, "orphan-section-heading", f"頁末孤兒標題：{last}"))

        if i > 0:
            prev = reader.pages[i - 1].extract_text() or ""
            if is_mindmap_heading(last_line(prev)) and (
                "→" in text or re.search(r"[A-Z]\[|-->", text)
            ):
                issues.append((pnum, "mindmap-split", "心智圖內容延續自上一頁標題"))

        if last and last in ("原典與注疏", "今注今譯與研究", "本專案內交叉引用"):
            issues.append((pnum, "orphan-h3", f"延伸閱讀小標在頁末：{last}"))

        # 結構圖標題孤兒
        if last and re.search(r"結構圖$", last):
            issues.append((pnum, "orphan-structure-heading", "頁末僅見「結構圖」，圖表可能在下一頁"))

    if not issues:
        print(f"OK — {len(reader.pages)} 頁；未偵測到空白頁或常見跨頁斷裂。")
        return 0

    print(f"發現 {len(issues)} 項排版疑慮（共 {len(reader.pages)} 頁）：\n")
    for pnum, kind, detail in issues:
        print(f"  p.{pnum} [{kind}] {detail}")
    return 1


if __name__ == "__main__":
    sys.exit(main())

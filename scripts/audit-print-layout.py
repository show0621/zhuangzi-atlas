#!/usr/bin/env python3
"""掃描印刷 PDF，找出空白頁、標題／圖表跨頁斷裂、稀疏頁等排版疑慮。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from pypdf import PdfReader

PDF = Path(__file__).resolve().parents[1] / "public" / "downloads" / "zhuangzi-atlas-print.pdf"

# 前後置：僅圖像、不編頁或頁碼極少屬正常
FRONT_MATTER_IMAGE_PAGES = {3}
BACK_MATTER_IMAGE_PAGES: set[int] = set()

# 書內頁碼（頁腳）與 PDF 頁序可能差 5 左右；稽核同時標示兩者
SPARSE_CHAR_THRESHOLD = 120
# 僅圖表頁（心智圖 SVG）可低於此值
MINDMAP_OK_PATTERNS = (r"16\.?心智圖", r"flowchart", r"→", r"\[")


def norm(s: str) -> str:
    return re.sub(r"\s+", "", s.replace("\u2060", ""))


def body_without_page_num(text: str) -> str:
    return re.sub(r"\n?\d{1,3}\s*$", "", text.strip())


def book_page_num(text: str) -> int | None:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if lines and re.fullmatch(r"\d{1,3}", lines[-1]):
        return int(lines[-1])
    return None


def last_line(text: str) -> str | None:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return None
    if re.fullmatch(r"\d{1,3}", lines[-1]) and len(lines) > 1:
        return norm(lines[-2])
    return norm(lines[-1])


def first_substantial_line(text: str) -> str | None:
    for line in text.split("\n"):
        s = line.strip()
        if not s or re.fullmatch(r"\d{1,3}", s):
            continue
        return norm(s)
    return None


def is_mindmap_heading(line: str | None) -> bool:
    return bool(line and re.search(r"16\.?心智圖", line))


def is_section_heading(line: str | None) -> bool:
    return bool(line and re.fullmatch(r"\d{1,2}\.[\u4e00-\u9fff]{2,12}", line))


def page_label(pdf_page: int, book_page: int | None) -> str:
    if book_page is not None:
        return f"p.{pdf_page}（書頁 {book_page}）"
    return f"p.{pdf_page}"


def main() -> int:
    if not PDF.exists():
        print(f"找不到 {PDF}，請先執行 npm run ebook:pdf", file=sys.stderr)
        return 2

    reader = PdfReader(str(PDF))
    issues: list[tuple[int, int | None, str, str]] = []

    for i, page in enumerate(reader.pages):
        pnum = i + 1
        text = page.extract_text() or ""
        bp = book_page_num(text)
        n = norm(text)
        body = norm(body_without_page_num(text))
        last = last_line(text)
        first = first_substantial_line(text)

        if len(body) < 20 and pnum not in FRONT_MATTER_IMAGE_PAGES | BACK_MATTER_IMAGE_PAGES:
            issues.append((pnum, bp, "blank-page", f"近空白頁（正文 {len(body)} 字）"))

        if (
            len(body) < SPARSE_CHAR_THRESHOLD
            and pnum not in FRONT_MATTER_IMAGE_PAGES | BACK_MATTER_IMAGE_PAGES
            and not any(re.search(p, n) for p in MINDMAP_OK_PATTERNS)
        ):
            issues.append((pnum, bp, "sparse-page", f"內容過疏（{len(body)} 字）"))

        if is_mindmap_heading(last) and "flowchart" not in n and "→" not in text:
            issues.append(
                (pnum, bp, "orphan-mindmap-heading", "頁末僅見「16.心智圖」，圖表可能在下一頁"),
            )

        if last and re.search(r"^04\.?原典$", last):
            issues.append((pnum, bp, "orphan-section-heading", "頁末僅見 §04 原典標題"))

        if (
            first
            and re.search(r"^04\.?原典$", first)
            and len(body) < SPARSE_CHAR_THRESHOLD
            and pnum not in FRONT_MATTER_IMAGE_PAGES | BACK_MATTER_IMAGE_PAGES
        ):
            issues.append(
                (pnum, bp, "sparse-section04", f"§04 原典頁過疏（{len(body)} 字），標題可能與內文割裂"),
            )

        if (
            first
            and re.search(r"^07\.?段落解析$", first)
            and len(body) < SPARSE_CHAR_THRESHOLD
            and pnum not in FRONT_MATTER_IMAGE_PAGES | BACK_MATTER_IMAGE_PAGES
        ):
            issues.append(
                (pnum, bp, "sparse-section07", f"§07 段落解析頁過疏（{len(body)} 字），子節可能被整塊推到下頁"),
            )

        if last and is_section_heading(last) and "17.延伸閱讀" not in last:
            issues.append((pnum, bp, "orphan-section-heading", f"頁末孤兒標題：{last}"))

        if i > 0:
            prev = reader.pages[i - 1].extract_text() or ""
            prev_last = last_line(prev)
            if is_mindmap_heading(prev_last) and ("→" in text or re.search(r"[A-Z]\[|-->", text)):
                issues.append((pnum, bp, "mindmap-split", "心智圖內容延續自上一頁標題"))

            prev_n = norm(prev)
            if re.search(r"16\.?心智圖", prev_n) and re.search(r"17\.?延伸閱讀", n):
                issues.append(
                    (pnum, bp, "mindmap-bibliography-same-page", "心智圖與§17延伸閱讀同頁"),
                )

            # 結構圖僅 ASCII 在上一頁、mermaid 在下一頁（非刻意分頁）
            if re.search(r"結構圖", prev_n) and not re.search(r"04\.?原典", prev_n):
                if ("flowchart" in n or re.search(r"[A-Z]\[", text)) and not re.search(
                    r"結構圖", n
                ):
                    issues.append(
                        (pnum, bp, "structure-diagram-split", "結構圖 ASCII 與流程圖割裂"),
                    )

        if last and last in ("原典與注疏", "今注今譯與研究", "本專案內交叉引用"):
            issues.append((pnum, bp, "orphan-h3", f"延伸閱讀小標在頁末：{last}"))

        if last and re.search(r"結構圖$", last):
            issues.append((pnum, bp, "orphan-structure-heading", "頁末僅見「結構圖」，圖表可能在下一頁"))

        if re.search(r"16\.?心智圖", n) and re.search(r"17\.?延伸閱讀", n):
            issues.append(
                (pnum, bp, "mindmap-bibliography-same-page", "心智圖與§17延伸閱讀同頁，應分頁"),
            )

    if not issues:
        print(f"OK — {len(reader.pages)} 頁；未偵測到空白頁、稀疏頁或常見跨頁斷裂。")
        return 0

    # 去重（同頁同類型）
    seen: set[tuple[int, str]] = set()
    unique: list[tuple[int, int | None, str, str]] = []
    for row in issues:
        key = (row[0], row[2])
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)

    print(f"發現 {len(unique)} 項排版疑慮（共 {len(reader.pages)} 頁）：\n")
    for pnum, bp, kind, detail in unique:
        print(f"  {page_label(pnum, bp)} [{kind}] {detail}")
    return 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""掃描印刷 PDF，找出空白頁、標題／圖表跨頁斷裂、稀疏頁等排版疑慮。"""
from __future__ import annotations

import re
import sys
import unicodedata
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
# 結構圖 ASCII 頁／Mermaid 分頁：字數少但圖佔版面，不算過疏
STRUCTURE_OK_PATTERNS = (r"結構圖", r"結構流程圖", r"岸邊相遇", r"↓")


def norm(s: str) -> str:
    # NFKC：pdf 抽取偶發康熙部首（⼼→心、⽼→老）
    return unicodedata.normalize("NFKC", re.sub(r"\s+", "", s.replace("\u2060", "")))


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


def spaced_section_heading(line: str) -> str | None:
    """Match '0 9 .  哲  學  分  析' style PDF extraction."""
    n = norm(line)
    m = re.fullmatch(r"(\d{1,2})\.([\u4e00-\u9fff]{2,12})", n)
    return f"{m.group(1)}.{m.group(2)}" if m else None


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
            and not any(re.search(p, n) for p in STRUCTURE_OK_PATTERNS)
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

            # 結構圖標題在頁末、圖卻在下頁（真斷裂）。
            # ASCII 文字圖與 Mermaid 刻意分頁：上頁有「結構圖」正文、下頁為流程圖——允許。
            if prev_last and re.search(r"結構圖$", prev_last):
                if "flowchart" in n or re.search(r"[A-Z]\[|→", text):
                    issues.append(
                        (pnum, bp, "structure-diagram-split", "結構圖標題與圖表跨頁割裂"),
                    )

        if last and last in ("原典與注疏", "今注今譯與研究", "本專案內交叉引用"):
            issues.append((pnum, bp, "orphan-h3", f"延伸閱讀小標在頁末：{last}"))

        if last and re.search(r"結構圖$", last):
            issues.append((pnum, bp, "orphan-structure-heading", "頁末僅見「結構圖」，圖表可能在下一頁"))

        # 心智圖獨佔一頁後接 §17：可接受（圖需適中可讀）；不再視為錯誤
        # （舊規則 mindmap-alone-before-refs / refs-heading-orphan 已停用）

        # 頁末開新節、且下一頁仍接續同節（非新標題）：應整組移到下一頁
        body_lines = [
            l.strip()
            for l in body_without_page_num(text).split("\n")
            if l.strip()
        ]
        last_sec_idx = None
        last_sec = None
        for j, line in enumerate(body_lines):
            sh = spaced_section_heading(line)
            if sh:
                num = int(sh.split(".", 1)[0])
                if 8 <= num <= 15:
                    last_sec_idx = j
                    last_sec = sh
        if last_sec_idx is not None and body_lines and i + 1 < len(reader.pages):
            after = norm("".join(body_lines[last_sec_idx + 1 :]))
            near_bottom = last_sec_idx >= max(0, len(body_lines) - 6)
            if near_bottom and len(after) < 160:
                next_text = reader.pages[i + 1].extract_text() or ""
                next_lines = [
                    l.strip()
                    for l in body_without_page_num(next_text).split("\n")
                    if l.strip()
                ]
                next_first = next_lines[0] if next_lines else ""
                next_norm = norm(next_first)
                next_is_new_heading = bool(
                    spaced_section_heading(next_first)
                    or re.match(r"^\d{1,2}\.[\u4e00-\u9fff]", next_norm)
                    or next_first.startswith("閱讀")
                    or next_norm.startswith("註：")
                    or re.match(r"^16\.?心智圖", next_norm)
                )
                # §15 完整收在頁末、下頁為心智圖：允許；僅當總結正文跨頁才警示
                if (
                    last_sec
                    and last_sec.startswith("15.")
                    and re.match(r"^16\.?心智圖", next_norm)
                ):
                    next_is_new_heading = True
                # 與 find-bottom-strands 對齊：僅標「標題後所剩無幾」的嚴重懸空
                if not next_is_new_heading and len(after) < 80:
                    issues.append(
                        (
                            pnum,
                            bp,
                            "bottom-stranded-section",
                            f"頁末開§{last_sec}（後接 {len(after)} 字）並跨到下頁，應整組移頁",
                        ),
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

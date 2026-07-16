from __future__ import annotations

from typing import Any


THEME_ALIASES: dict[str, list[str]] = {
    "焦慮": ["焦躁", "不安", "比較", "壓力", "有待", "逍遙遊"],
    "比較": ["競爭", "輸贏", "高低", "有待", "逍遙遊"],
    "升遷": ["工作", "職場", "成功", "功名", "有待", "無名", "無用之用"],
    "成功": ["成就", "功名", "表現", "有待", "無名", "無用之用"],
    "死亡": ["死亡", "死", "喪親", "失去", "死生", "大宗師", "至樂"],
    "財富": ["金錢", "賺錢", "富有", "資產", "無用之用", "惠子", "惠施"],
    "無用": ["沒用", "價值", "實用", "無用之用", "惠子", "逍遙遊"],
}


def _terms(query: str) -> list[str]:
    compact = query.replace(" ", "").strip()
    aliases: list[str] = []
    for theme, words in THEME_ALIASES.items():
        if theme in compact or any(w in compact for w in words):
            aliases.extend([theme, *words])
    bigrams = [compact[i : i + 2] for i in range(max(0, len(compact) - 1))]
    words = [w for w in query.replace("，", " ").replace("。", " ").split() if len(w) > 1]
    out = []
    seen = set()
    for t in [compact, *words, *aliases, *bigrams]:
        if len(t) > 1 and t not in seen:
            seen.add(t)
            out.append(t)
    return out


def retrieve(query: str, chunks: list[dict[str, Any]], limit: int = 5) -> list[dict[str, Any]]:
    terms = _terms(query)
    if not terms:
        return []
    scored: list[dict[str, Any]] = []
    for chunk in chunks:
        title = f"{chunk.get('title', '')} {chunk.get('heading', '')}"
        tags = " ".join(chunk.get("tags") or [])
        text = chunk.get("text") or ""
        score = 0
        for term in terms:
            score += text.count(term)
            if term in title:
                score += 5
            if term in tags:
                score += 4
        if score > 0:
            scored.append({**chunk, "score": score})
    scored.sort(key=lambda c: (-c["score"], c.get("title", "")))
    return scored[:limit]


def answer_from_chunks(query: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    results = retrieve(query, chunks, 4)
    weak = len(results) == 0 or results[0]["score"] < 3
    if not results:
        return {
            "answer": "目前找不到足以直接回答的本庫材料。可改問「逍遙遊」「無待」「無用之用」。",
            "citations": [],
            "weakMatch": True,
        }

    def excerpt(text: str) -> str:
        t = " ".join(text.split())
        return (t[:220].rstrip("，、；： ") + "。") if len(t) > 220 else t

    lines = [
        f"〈{c['title']}〉「{c['heading']}」：{excerpt(c['text'])}" for c in results
    ]
    caveat = "命中較弱，僅供線索。" if weak else "以下僅根據本庫已命中段落整理。"
    return {
        "answer": f"這是本庫檢索整理，不是偽託莊子原話。{caveat}\n\n" + "\n\n".join(lines),
        "citations": [
            {
                "id": c.get("id"),
                "sourceType": c.get("sourceType"),
                "slug": c.get("slug"),
                "title": c.get("title"),
                "heading": c.get("heading"),
            }
            for c in results
        ],
        "weakMatch": weak,
    }

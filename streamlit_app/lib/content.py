from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"
CHAPTERS_DIR = CONTENT / "chapters"
INDEXES = CONTENT / "indexes"


def _parse_frontmatter(raw: str) -> tuple[dict[str, Any], str]:
    if not raw.startswith("---"):
        return {}, raw
    parts = raw.split("---", 2)
    if len(parts) < 3:
        return {}, raw
    meta = yaml.safe_load(parts[1]) or {}
    return meta, parts[2].lstrip("\n")


@lru_cache(maxsize=1)
def load_chapter_index() -> list[dict[str, Any]]:
    path = INDEXES / "chapters.json"
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("chapters", [])

    # fallback: scan markdown
    chapters: list[dict[str, Any]] = []
    for path in sorted(CHAPTERS_DIR.rglob("*.md")):
        meta, _ = _parse_frontmatter(path.read_text(encoding="utf-8"))
        if not meta:
            continue
        chapters.append(
            {
                "id": str(meta.get("id", "")),
                "slug": meta.get("slug", path.stem),
                "title": meta.get("title", path.stem),
                "part": meta.get("part", ""),
                "status": meta.get("status", "skeleton"),
                "summary": meta.get("summary", ""),
                "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            }
        )
    return sorted(chapters, key=lambda c: int(c.get("id") or 0))


def chapter_file(meta: dict[str, Any]) -> Path | None:
    rel = meta.get("path")
    if rel:
        p = ROOT / rel
        if p.exists():
            return p
    slug = meta.get("slug")
    matches = list(CHAPTERS_DIR.rglob(f"*-{slug}.md"))
    return matches[0] if matches else None


@lru_cache(maxsize=64)
def read_chapter(slug: str) -> dict[str, Any] | None:
    for meta in load_chapter_index():
        if meta.get("slug") == slug:
            path = chapter_file(meta)
            if not path:
                return None
            fm, body = _parse_frontmatter(path.read_text(encoding="utf-8"))
            return {"meta": {**meta, **fm}, "content": body, "path": str(path)}
    return None


@lru_cache(maxsize=1)
def load_rag_chunks() -> list[dict[str, Any]]:
    path = INDEXES / "rag-chunks.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8")).get("chunks", [])


@lru_cache(maxsize=1)
def load_theme_map() -> dict[str, Any]:
    path = INDEXES / "theme-map.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def read_markdown_file(rel_path: str) -> str:
    path = CONTENT / rel_path
    if not path.exists():
        return f"（找不到 {rel_path}）"
    raw = path.read_text(encoding="utf-8")
    _, body = _parse_frontmatter(raw)
    return body


def search_chapters(query: str, limit: int = 20) -> list[dict[str, Any]]:
    q = query.strip().lower()
    if not q:
        return []
    hits: list[dict[str, Any]] = []
    for meta in load_chapter_index():
        doc = read_chapter(meta["slug"])
        if not doc:
            continue
        hay = f"{doc['meta'].get('title','')}\n{doc['meta'].get('summary','')}\n{doc['content']}".lower()
        if q not in hay:
            continue
        idx = doc["content"].lower().find(q)
        excerpt = (
            doc["content"][max(0, idx - 40) : idx + len(q) + 80].replace("\n", " ")
            if idx >= 0
            else doc["meta"].get("summary", "")
        )
        score = hay.count(q)
        if q in str(doc["meta"].get("title", "")).lower():
            score += 10
        hits.append({**doc["meta"], "excerpt": excerpt, "score": score})
    return sorted(hits, key=lambda x: -x["score"])[:limit]


def parts_order() -> list[str]:
    return ["導論", "內篇", "外篇", "雜篇"]

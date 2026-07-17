from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.content import load_chapter_index, read_chapter
from lib.mermaid import render_markdown_with_mermaid
from lib.ui import setup_page, sidebar_nav

setup_page("閱讀篇章")
sidebar_nav()

st.title("閱讀篇章")

chapters = load_chapter_index()
options = {f"{c.get('id')} 〈{c.get('title')}〉": c.get("slug") for c in chapters}
default_slug = st.session_state.get("selected_slug", "逍遙遊")
default_label = next((k for k, v in options.items() if v == default_slug), list(options.keys())[1] if len(options) > 1 else list(options.keys())[0])

label = st.selectbox("選擇篇章", list(options.keys()), index=list(options.keys()).index(default_label))
slug = options[label]
st.session_state["selected_slug"] = slug

doc = read_chapter(slug)
if not doc:
    st.error("找不到篇章內容。")
    st.stop()

meta = doc["meta"]
st.markdown(f"## 〈{meta.get('title')}〉")
st.caption(f"{meta.get('part')} · 狀態 {meta.get('status')} · {meta.get('summary','')}")

# 手機閱讀：分段摺疊長文，避免一次過長
body = doc["content"]
sections = []
current = {"title": "本文", "lines": []}
for line in body.splitlines():
    if line.startswith("## "):
        if current["lines"]:
            sections.append(current)
        current = {"title": line[3:].strip(), "lines": []}
    else:
        current["lines"].append(line)
if current["lines"] or current["title"] != "本文":
    sections.append(current)

if not sections:
    st.markdown(body)
else:
    for i, sec in enumerate(sections):
        expanded = i < 2  # 前兩節預設展開，適合手機
        with st.expander(sec["title"], expanded=expanded):
            content = "\n".join(sec["lines"]) if sec["lines"] else "_（本節尚無內容）_"
            if "```mermaid" in content:
                render_markdown_with_mermaid(content, key_prefix=f"{slug}-{i}")
            else:
                st.markdown(content)

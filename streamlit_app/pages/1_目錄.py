from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.content import load_chapter_index, parts_order
from lib.ui import setup_page, sidebar_nav

setup_page("全書目錄")
sidebar_nav()

st.title("全書目錄")
st.caption("點選篇章後會前往閱讀頁。")

chapters = load_chapter_index()
for part in parts_order():
    items = [c for c in chapters if c.get("part") == part]
    st.markdown(f"### {part}")
    for c in items:
        label = f"{c.get('id')} 〈{c.get('title')}〉 · {c.get('status')}"
        if st.button(label, key=f"toc-{c.get('slug')}", use_container_width=True):
            st.session_state["selected_slug"] = c.get("slug")
            st.switch_page("pages/2_閱讀.py")
        st.caption(c.get("summary", ""))

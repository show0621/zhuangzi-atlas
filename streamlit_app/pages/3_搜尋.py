from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.content import search_chapters
from lib.ui import setup_page, sidebar_nav

setup_page("搜尋")
sidebar_nav()

st.title("搜尋")
st.caption("搜尋篇章全文（含標題與摘要）。")

q = st.text_input("關鍵字", placeholder="例如：無待、焦慮、惠子、夢蝶")
if q.strip():
    hits = search_chapters(q.strip())
    st.write(f"共 {len(hits)} 筆")
    for hit in hits:
        st.markdown(
            f"<div class='z-card'><strong>〈{hit.get('title')}〉</strong>"
            f"<div class='z-muted'>{hit.get('part')} · score {hit.get('score')}</div>"
            f"<div>{hit.get('excerpt','')}</div></div>",
            unsafe_allow_html=True,
        )
        if st.button(f"閱讀〈{hit.get('title')}〉", key=f"hit-{hit.get('slug')}", use_container_width=True):
            st.session_state["selected_slug"] = hit.get("slug")
            st.switch_page("pages/2_閱讀.py")
else:
    st.info("輸入關鍵字開始搜尋。")

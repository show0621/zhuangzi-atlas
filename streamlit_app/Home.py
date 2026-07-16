from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.content import load_chapter_index, parts_order
from lib.ui import setup_page, sidebar_nav

setup_page("首頁")
sidebar_nav()

st.title("莊子全解")
st.caption("原典・白話・哲學・人生智慧｜手機友善 Streamlit 版")

st.markdown(
    """
在手機開啟時：點左上角 **≡** 即可切換目錄、閱讀、搜尋與莊子 AI。

目前內容與網站共用同一個 `content/` 知識庫；〈逍遙遊〉已有出版級 draft，其餘篇章仍在骨架階段。
"""
)

chapters = load_chapter_index()
drafts = [c for c in chapters if c.get("status") == "draft"]
cols = st.columns(3)
cols[0].metric("篇章", len(chapters))
cols[1].metric("已有 draft", len(drafts))
cols[2].metric("版本", "V0.2")

st.subheader("快速開始")
c1, c2 = st.columns(2)
with c1:
    if st.button("閱讀〈逍遙遊〉", use_container_width=True):
        st.session_state["selected_slug"] = "逍遙遊"
        st.switch_page("pages/2_閱讀.py")
with c2:
    if st.button("打開莊子 AI", use_container_width=True):
        st.switch_page("pages/4_莊子AI.py")

st.subheader("各部概況")
for part in parts_order():
    items = [c for c in chapters if c.get("part") == part]
    with st.expander(f"{part}（{len(items)}）", expanded=(part == "內篇")):
        for c in items:
            st.markdown(
                f"<div class='z-card'><span class='z-tag'>{c.get('status')}</span>"
                f"<strong>〈{c.get('title')}〉</strong>"
                f"<div class='z-muted'>{c.get('summary','')}</div></div>",
                unsafe_allow_html=True,
            )

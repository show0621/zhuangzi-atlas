from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.content import read_markdown_file
from lib.ui import setup_page, sidebar_nav

setup_page("地圖與百科")
sidebar_nav()

st.title("思想地圖／百科")

tab1, tab2, tab3, tab4 = st.tabs(["思想地圖", "人物", "名詞", "主題"])

with tab1:
    st.markdown(read_markdown_file("maps/思想地圖.md"))
with tab2:
    st.markdown(read_markdown_file("figures/_index.md"))
    st.markdown(read_markdown_file("figures/惠施.md"))
with tab3:
    st.markdown(read_markdown_file("terms/_index.md"))
    st.markdown(read_markdown_file("terms/無待.md"))
with tab4:
    st.markdown(read_markdown_file("themes/_index.md"))
    st.markdown(read_markdown_file("themes/焦慮與比較.md"))

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.content import CONTENT, load_chapter_index, parts_order
from lib.ui import setup_page, sidebar_nav

setup_page("首頁")
sidebar_nav()

st.title("莊子全解")
st.caption("原典・白話・哲學・人生智慧｜手機友善 Streamlit 版")

st.markdown(
    """
**全書 34 篇架構正文已齊（draft）**：導論 + 內／外／雜篇皆依 17 節出版格式寫完。

手機請點左上角 **≡** 切換目錄、閱讀、搜尋、莊子 AI、地圖／百科。
"""
)

NEXT_BASE = "http://localhost:3000"
PAGES_BASE = "https://show0621.github.io/zhuangzi-atlas"
# 下載檔加版本參數，避免 GitHub Pages／瀏覽器快取舊 PDF
_ASSET_V = "cover-match-print"
PDF_URL = f"{PAGES_BASE}/downloads/zhuangzi-atlas-print.pdf?v={_ASSET_V}"
PDF_ALIAS_URL = f"{PAGES_BASE}/downloads/莊子全解-印刷版.pdf?v={_ASSET_V}"
DOCX_URL = f"{PAGES_BASE}/downloads/zhuangzi-atlas-print.docx?v={_ASSET_V}"
DOCX_ALIAS_URL = f"{PAGES_BASE}/downloads/莊子全解-印刷版.docx?v={_ASSET_V}"
COVER_PDF_URL = f"{PAGES_BASE}/downloads/zhuangzi-atlas-cover.pdf?v={_ASSET_V}"
BACK_PDF_URL = f"{PAGES_BASE}/downloads/zhuangzi-atlas-back.pdf?v={_ASSET_V}"
SPINE_PDF_URL = f"{PAGES_BASE}/downloads/zhuangzi-atlas-spine.pdf?v={_ASSET_V}"
FLAP_PDF_URL = f"{PAGES_BASE}/downloads/zhuangzi-atlas-flap.pdf?v={_ASSET_V}"
SPINE_DOCX_URL = f"{PAGES_BASE}/downloads/zhuangzi-atlas-spine.docx?v={_ASSET_V}"
NEXT_IMMERSIVE = f"{NEXT_BASE}/immersive/逍遙遊/"
MODE_LINKS = [
    ("純文字", "text"),
    ("沉浸", "immersive"),
    ("繪本", "pict"),
    ("播客", "podcast"),
]

st.subheader("下載完整書 PDF／Word")
st.caption(
    "Streamlit 版不含檔案下載。請開啟 Next 網站下載頁（本機需 `npm run dev`，或用 GitHub Pages）。"
)
dl1, dl2 = st.columns(2)
with dl1:
    st.link_button(
        "本機：下載印刷版",
        f"{NEXT_BASE}/download/",
        use_container_width=True,
        type="primary",
    )
with dl2:
    st.link_button(
        "線上：GitHub Pages",
        f"{PAGES_BASE}/download/",
        use_container_width=True,
    )
st.markdown(
    f"[直接 PDF（線上）]({PDF_URL}) · "
    f"[PDF 中文檔名]({PDF_ALIAS_URL}) · "
    f"[直接 Word（線上）]({DOCX_URL}) · "
    f"[Word 中文檔名]({DOCX_ALIAS_URL}) · "
    f"[封面]({COVER_PDF_URL}) · "
    f"[封底]({BACK_PDF_URL}) · "
    f"[書脊]({SPINE_PDF_URL}) · "
    f"[作者折頁]({FLAP_PDF_URL}) · "
    f"[書脊 Word]({SPINE_DOCX_URL})"
)

st.subheader("山上讀書（僅限 Next 網站）")
st.warning(
    "四版切換（純文字／沉浸／繪本／播客）**不會**出現在 Streamlit 內。"
    "請先執行 `npm run dev`，再點下方按鈕開啟 Next 的 `/immersive/`。"
)
st.caption("點擊會在瀏覽器開啟對應 `?mode=` 版面。")
mode_cols = st.columns(4)
for col, (label, mode) in zip(mode_cols, MODE_LINKS):
    with col:
        st.link_button(
            label,
            f"{NEXT_IMMERSIVE}?mode={mode}",
            use_container_width=True,
            type="primary" if mode == "immersive" else "secondary",
        )
st.markdown(
    f"[山上總覽 →]({NEXT_BASE}/immersive/)　·　"
    f"[GitHub Pages]({PAGES_BASE}/immersive/逍遙遊/?mode=immersive)"
)

chapters = load_chapter_index()
drafts = [c for c in chapters if c.get("status") in {"draft", "review", "published"}]
cols = st.columns(3)
cols[0].metric("篇章", len(chapters))
cols[1].metric("已完成 draft", len(drafts))
cols[2].metric("版本", "V0.3")

st.subheader("快速開始")
c1, c2, c3 = st.columns(3)
with c1:
    if st.button("導論", use_container_width=True):
        st.session_state["selected_slug"] = "導論"
        st.switch_page("pages/2_閱讀.py")
with c2:
    if st.button("〈逍遙遊〉", use_container_width=True):
        st.session_state["selected_slug"] = "逍遙遊"
        st.switch_page("pages/2_閱讀.py")
with c3:
    if st.button("莊子 AI", use_container_width=True):
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

_ = CONTENT  # keep import used for path stability

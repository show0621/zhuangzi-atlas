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
**全書 34 篇皆為 review**（送印可讀版）：每篇含走讀路線，依原典順序導讀。閱讀頁支援 **Mermaid 心智圖**。

手機請點左上角 **≡** 切換目錄、閱讀、搜尋、莊子 AI、地圖／百科。
"""
)

NEXT_BASE = "http://localhost:3000"
PAGES_BASE = "https://show0621.github.io/zhuangzi-atlas"
# 全套產檔版本戳：改這個可強制破除 GitHub Pages／瀏覽器舊快取
_ASSET_V = "all-review-v7-701c"
_DL = f"{PAGES_BASE}/downloads"

DOWNLOADS = [
    {
        "group": "內文成冊（菊16開・約 351 頁）",
        "items": [
            ("完整書 PDF", f"{_DL}/zhuangzi-atlas-print.pdf?v={_ASSET_V}", True),
            ("完整書 PDF（中文檔名）", f"{_DL}/莊子全解-印刷版.pdf?v={_ASSET_V}", False),
            ("完整書 Word", f"{_DL}/zhuangzi-atlas-print.docx?v={_ASSET_V}", True),
            ("完整書 Word（中文檔名）", f"{_DL}/莊子全解-印刷版.docx?v={_ASSET_V}", False),
        ],
    },
    {
        "group": "上機／裝幀",
        "items": [
            ("封面展開 PDF（上機）", f"{_DL}/zhuangzi-atlas-cover-wrap.pdf?v={_ASSET_V}", True),
            ("封面展開（中文檔名）", f"{_DL}/莊子全解-封面展開.pdf?v={_ASSET_V}", False),
            ("書脊 PDF（24×210 mm）", f"{_DL}/zhuangzi-atlas-spine.pdf?v={_ASSET_V}", False),
            ("書脊 Word", f"{_DL}/zhuangzi-atlas-spine.docx?v={_ASSET_V}", False),
            ("封面單頁", f"{_DL}/zhuangzi-atlas-cover.pdf?v={_ASSET_V}", False),
            ("封底單頁", f"{_DL}/zhuangzi-atlas-back.pdf?v={_ASSET_V}", False),
            ("作者折頁", f"{_DL}/zhuangzi-atlas-flap.pdf?v={_ASSET_V}", False),
        ],
    },
]

st.subheader("下載最新印刷套件")
st.success(
    f"已對齊 GitHub Pages 最新產檔（版本 `{_ASSET_V}`）。"
    "含：菊16開內文 PDF／Word、封面展開、書脊、封面／封底／折頁。"
    "頁碼自「自序」起算；題辭／後記書法為去底色版。"
)
st.caption(
    "若仍下到舊檔：請用下方按鈕（含版本參數），或強制重新整理／無痕視窗。"
    f" 亦可開 [下載總頁]({PAGES_BASE}/download/?v={_ASSET_V})。"
)

for block in DOWNLOADS:
    st.markdown(f"**{block['group']}**")
    cols = st.columns(2)
    for i, (label, url, primary) in enumerate(block["items"]):
        with cols[i % 2]:
            st.link_button(
                label,
                url,
                use_container_width=True,
                type="primary" if primary else "secondary",
            )

st.link_button(
    "開啟線上下載總頁（GitHub Pages）",
    f"{PAGES_BASE}/download/?v={_ASSET_V}",
    use_container_width=True,
)

NEXT_IMMERSIVE = f"{NEXT_BASE}/immersive/逍遙遊/"
MODE_LINKS = [
    ("純文字", "text"),
    ("沉浸", "immersive"),
    ("繪本", "pict"),
    ("播客", "podcast"),
]

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

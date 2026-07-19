from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.assets import (
    ASSET_V,
    PAGES_BASE,
    PRINT_PAGES_HINT,
    SITE_VERSION,
    pages_url,
    read_bytes,
)
from lib.content import CONTENT, load_chapter_index, parts_order
from lib.ui import setup_page, sidebar_nav

setup_page("首頁")
sidebar_nav()

st.title("莊子全解")
st.caption("原典・白話・哲學・人生智慧｜手機友善 Streamlit 版")

st.markdown(
    f"""
**全書 34 篇皆為 published（V{SITE_VERSION}）**：依原典順序導讀，閱讀頁支援 **Mermaid 心智圖**。

手機請點左上角 **≡** 切換目錄、閱讀、搜尋、莊子 AI、地圖／百科。
"""
)

NEXT_BASE = "http://localhost:3000"

DOWNLOADS = [
    {
        "group": f"內文成冊（菊16開・{PRINT_PAGES_HINT}）",
        "items": [
            ("完整書 PDF", "zhuangzi-atlas-print.pdf", "application/pdf", True),
            ("完整書 PDF（中文檔名）", "莊子全解-印刷版.pdf", "application/pdf", False),
            (
                "完整書 Word",
                "zhuangzi-atlas-print.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                True,
            ),
            (
                "完整書 Word（中文檔名）",
                "莊子全解-印刷版.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                False,
            ),
        ],
    },
    {
        "group": "上機／裝幀",
        "items": [
            ("封面展開 PDF（上機）", "zhuangzi-atlas-cover-wrap.pdf", "application/pdf", True),
            ("封面展開（中文檔名）", "莊子全解-封面展開.pdf", "application/pdf", False),
            ("書脊 PDF（24×210 mm）", "zhuangzi-atlas-spine.pdf", "application/pdf", False),
            (
                "書脊 Word",
                "zhuangzi-atlas-spine.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                False,
            ),
            ("封面單頁", "zhuangzi-atlas-cover.pdf", "application/pdf", False),
            ("封底單頁", "zhuangzi-atlas-back.pdf", "application/pdf", False),
            ("作者折頁", "zhuangzi-atlas-flap.pdf", "application/pdf", False),
        ],
    },
]

st.subheader("下載最新印刷套件")
st.success(
    f"目前套件版本 `{ASSET_V}`（網站 V{SITE_VERSION}，{PRINT_PAGES_HINT}）。"
    "優先從本 repo 的 `public/downloads` 直接下載，不需等 GitHub Pages 部署。"
    "頁碼自「自序」起算；題辭／後記書法為去底色版。"
)
st.caption(
    "若按鈕顯示「改開線上連結」，代表此環境沒有打包該檔，會改連 GitHub Pages。"
    f" 線上總頁：[download/?v={ASSET_V}]({PAGES_BASE}/download/?v={ASSET_V})"
)

for block in DOWNLOADS:
    st.markdown(f"**{block['group']}**")
    cols = st.columns(2)
    for i, (label, filename, mime, primary) in enumerate(block["items"]):
        with cols[i % 2]:
            data = read_bytes(filename)
            if data is not None:
                st.download_button(
                    label=label,
                    data=data,
                    file_name=filename,
                    mime=mime,
                    use_container_width=True,
                    type="primary" if primary else "secondary",
                    key=f"dl-{filename}",
                )
            else:
                st.link_button(
                    f"{label}（線上）",
                    pages_url(filename),
                    use_container_width=True,
                    type="primary" if primary else "secondary",
                )

st.link_button(
    "開啟線上下載總頁（GitHub Pages）",
    f"{PAGES_BASE}/download/?v={ASSET_V}",
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
published = [c for c in chapters if c.get("status") == "published"]
cols = st.columns(3)
cols[0].metric("篇章", len(chapters))
cols[1].metric("published", len(published))
cols[2].metric("版本", f"V{SITE_VERSION}")

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

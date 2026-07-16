from __future__ import annotations

import streamlit as st


MOBILE_CSS = """
<style>
  /* 手機友善：加大點擊區、縮小邊距、改善可讀性 */
  .block-container {
    padding-top: 1rem !important;
    padding-bottom: 2rem !important;
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    max-width: 780px !important;
  }
  h1, h2, h3 {
    font-family: "Noto Serif TC", "Source Han Serif TC", serif !important;
    letter-spacing: 0.02em;
  }
  .stMarkdown, .stText, p, li {
    line-height: 1.75 !important;
    font-size: 1.02rem !important;
  }
  div[data-testid="stSidebar"] {
    background: #efe8dc;
  }
  .z-card {
    border: 1px solid #d9d0c3;
    border-radius: 12px;
    padding: 0.9rem 1rem;
    background: rgba(247, 243, 235, 0.7);
    margin-bottom: 0.6rem;
  }
  .z-muted { color: #6b6560; font-size: 0.92rem; }
  .z-tag {
    display: inline-block;
    border: 1px solid #d9d0c3;
    border-radius: 999px;
    padding: 0.1rem 0.55rem;
    font-size: 0.8rem;
    color: #6b6560;
    margin-right: 0.35rem;
  }
  @media (max-width: 640px) {
    .block-container {
      padding-left: 0.7rem !important;
      padding-right: 0.7rem !important;
    }
    .stMarkdown, .stText, p, li { font-size: 1.05rem !important; }
  }
</style>
"""


def setup_page(title: str, icon: str = "📜") -> None:
    st.set_page_config(
        page_title=f"{title}｜莊子全解",
        page_icon=icon,
        layout="centered",
        initial_sidebar_state="collapsed",
    )
    st.markdown(MOBILE_CSS, unsafe_allow_html=True)


def sidebar_nav() -> None:
    with st.sidebar:
        st.markdown("### 莊子全解")
        st.caption("手機請點左上角 ≡ 開啟選單")
        st.page_link("Home.py", label="首頁", icon="🏠")
        st.page_link("pages/1_目錄.py", label="全書目錄", icon="📚")
        st.page_link("pages/2_閱讀.py", label="閱讀篇章", icon="📖")
        st.page_link("pages/3_搜尋.py", label="搜尋", icon="🔍")
        st.page_link("pages/4_莊子AI.py", label="莊子 AI", icon="🤖")
        st.page_link("pages/5_地圖與百科.py", label="地圖／百科", icon="🗺️")
        st.divider()
        st.markdown("**下載 PDF／Word**（Next 網站）")
        st.markdown(
            "- [本機下載頁](http://localhost:3000/download/)\n"
            "- [GitHub Pages](https://show0621.github.io/zhuangzi-atlas/download/)"
        )
        st.divider()
        st.caption("內容來源：content/　版本 V0.2")

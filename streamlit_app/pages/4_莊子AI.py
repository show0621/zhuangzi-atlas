from __future__ import annotations

import sys
from pathlib import Path

import requests
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.content import load_rag_chunks, load_theme_map
from lib.rag import answer_from_chunks
from lib.ui import setup_page, sidebar_nav

setup_page("莊子 AI", icon="🤖")
sidebar_nav()

st.title("莊子 AI")
st.caption("先檢索本庫，再可選本機 Ollama 回答。資料可留在你的電腦。")

mode = st.radio("模式", ["純檢索（免模型）", "本機 LLM（Ollama）"], horizontal=True)
examples = ["焦慮與比較", "升遷與成功", "如何面對死亡", "財富有何意義", "什麼是無用之用"]
ex = st.selectbox("範例問題", ["（自訂）", *examples])
query = st.text_area("你的問題", value="" if ex == "（自訂）" else ex, height=100)

themes = load_theme_map()
if themes:
    st.caption("主題：" + "、".join(themes.keys()))

if st.button("提問", type="primary", use_container_width=True):
    q = query.strip()
    if not q:
        st.warning("請先輸入問題")
    elif mode.startswith("純檢索"):
        result = answer_from_chunks(q, load_rag_chunks())
        st.markdown("### 本庫檢索整理")
        if result["weakMatch"]:
            st.info("命中較弱，請當閱讀線索。")
        st.write(result["answer"])
        if result["citations"]:
            st.markdown("#### 引用")
            for c in result["citations"]:
                st.markdown(f"- 〈{c['title']}〉 · {c['heading']}")
    else:
        try:
            health = requests.get("http://127.0.0.1:8787/health", timeout=2)
            health_data = health.json()
            if not health_data.get("ok"):
                st.warning(health_data.get("hint") or "本機 AI 服務未就緒")
            resp = requests.post(
                "http://127.0.0.1:8787/ask",
                json={"query": q},
                timeout=180,
            )
            resp.raise_for_status()
            data = resp.json()
            st.markdown("### 本機 LLM 回答" if data.get("backend") == "ollama" else "### 檢索整理")
            st.caption(f"後端：{data.get('model', '')}")
            st.write(data.get("answer", ""))
            cites = data.get("citations") or []
            if cites:
                st.markdown("#### 引用")
                for c in cites:
                    st.markdown(f"- 〈{c.get('title')}〉 · {c.get('heading')}")
        except Exception as exc:  # noqa: BLE001
            st.error(
                f"無法連線本機 AI 服務：{exc}\n\n"
                "請另開終端執行：`npm run ai:serve`（並先安裝 Ollama、pull qwen2.5:3b）\n"
                "或改用「純檢索」模式。"
            )
            result = answer_from_chunks(q, load_rag_chunks())
            st.markdown("### 後備：純檢索")
            st.write(result["answer"])

with st.expander("本機 LLM 設定（第一次）"):
    st.markdown(
        """
1. 安裝 [Ollama](https://ollama.com/download)
2. `ollama pull qwen2.5:3b`
3. 在專案根目錄：`npm run ai:serve`
4. 回到此頁選「本機 LLM」
        """
    )

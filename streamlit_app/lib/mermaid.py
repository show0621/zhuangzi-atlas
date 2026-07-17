"""Streamlit：將 Markdown 中的 mermaid 區塊渲染為 SVG 圖。"""

from __future__ import annotations

import html
import re

import streamlit.components.v1 as components

_MERMAID_RE = re.compile(r"```mermaid\r?\n([\s\S]*?)```", re.MULTILINE)


def _mermaid_html(code: str, uid: str) -> str:
    escaped = html.escape(code.strip())
    return f"""<div class="mermaid" id="mermaid-{uid}">{escaped}</div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({{ startOnLoad: false, theme: "neutral", securityLevel: "loose" }});
  mermaid.run({{ nodes: [document.getElementById("mermaid-{uid}")] }});
</script>"""


def render_markdown_with_mermaid(text: str, *, key_prefix: str = "md") -> None:
    """分段輸出：一般 Markdown 用 st.markdown，mermaid 用 HTML 元件。"""
    import streamlit as st

    parts = _MERMAID_RE.split(text)
    # split with capture: [before, mermaid1, after1, mermaid2, ...]
    idx = 0
    for i, part in enumerate(parts):
        if i % 2 == 1:
            components.html(
                _mermaid_html(part, f"{key_prefix}-{idx}"),
                height=320,
                scrolling=True,
            )
            idx += 1
        elif part.strip():
            st.markdown(part)

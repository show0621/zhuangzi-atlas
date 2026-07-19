"""印刷產檔版本與本地下載路徑（Streamlit 優先用 repo 內檔，不依賴 GitHub Pages 是否已部署）。"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOWNLOADS_DIR = ROOT / "public" / "downloads"

# 改這個可強制破除瀏覽器／Pages 舊快取；本地下載鈕不依賴 Pages
ASSET_V = "publish-v28-binding-docx-701c"
PAGES_BASE = "https://show0621.github.io/zhuangzi-atlas"
SITE_VERSION = "1.0.0"
PRINT_PAGES_HINT = "約 450 頁"


def pages_url(filename: str) -> str:
    return f"{PAGES_BASE}/downloads/{filename}?v={ASSET_V}"


def local_file(filename: str) -> Path | None:
    path = DOWNLOADS_DIR / filename
    return path if path.is_file() else None


def read_bytes(filename: str) -> bytes | None:
    path = local_file(filename)
    return path.read_bytes() if path else None

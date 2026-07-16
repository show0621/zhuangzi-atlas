/** Prefix public asset paths for GitHub Pages basePath. */
export function assetPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Cache-bust query for large downloadable assets (PDF/Word) on GitHub Pages CDN. */
export function assetPathWithVersion(path: string): string {
  const ver =
    process.env.NEXT_PUBLIC_ASSET_VER?.slice(0, 10) ||
    process.env.NEXT_PUBLIC_BASE_PATH ||
    "dev";
  const href = assetPath(path);
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}v=${encodeURIComponent(ver)}`;
}

/** Immersive reader view modes — shared by shell, links, and Streamlit. */

export const VIEW_MODES = ["text", "immersive", "pict", "podcast"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  text: "純文字",
  immersive: "沉浸",
  pict: "繪圖",
  podcast: "播客",
};

export const VIEW_MODE_SUBTITLES: Record<ViewMode, string> = {
  text: "清水卷・純文字版",
  immersive: "山上微風・沉浸版",
  pict: "時光靜好・繪圖版",
  podcast: "樹下對談・播客版",
};

export const IMMERSIVE_MODE_STORAGE_KEY = "zhuangzi-immersive-mode";

export function parseViewMode(raw: string | null | undefined): ViewMode | null {
  if (!raw) return null;
  return (VIEW_MODES as readonly string[]).includes(raw) ? (raw as ViewMode) : null;
}

export function immersiveChapterHref(slug: string, mode?: ViewMode): string {
  const base = `/immersive/${slug}/`;
  return mode ? `${base}?mode=${mode}` : base;
}

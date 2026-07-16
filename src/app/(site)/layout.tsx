import Link from "next/link";
import { SITE } from "@/lib/catalog";
import {
  immersiveChapterHref,
  VIEW_MODE_LABELS,
  VIEW_MODES,
} from "@/lib/immersiveMode";

const nav = [
  { href: "/immersive/", label: "山上讀書" },
  { href: "/toc/", label: "目錄" },
  { href: "/download/", label: "下載印刷版" },
  { href: "/maps/", label: "思想地圖" },
  { href: "/figures/", label: "人物" },
  { href: "/terms/", label: "名詞" },
  { href: "/themes/", label: "主題" },
  { href: "/search/", label: "搜尋" },
  { href: "/ai/", label: "莊子 AI" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-[#f7faf8]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/immersive/" className="font-serif text-lg tracking-wide text-ink">
              {SITE.title}
              <span className="ml-2 text-sm font-sans font-normal text-muted">
                {SITE.englishTitle}
              </span>
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-muted">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    item.href === "/download/"
                      ? "rounded-full bg-accent/90 px-3 py-1 text-white hover:opacity-90 transition"
                      : "hover:text-accent transition-colors"
                  }
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/" className="hover:text-accent transition-colors">
                知識庫
              </Link>
            </nav>
          </div>
          <div
            className="flex flex-wrap items-center gap-1.5"
            aria-label="閱讀版本快捷入口"
          >
            <span className="mr-1 text-[11px] tracking-wide text-muted">四版：</span>
            {VIEW_MODES.map((mode) => (
              <Link
                key={mode}
                href={immersiveChapterHref("逍遙遊", mode)}
                className="rounded-full border border-line/70 bg-white/50 px-2.5 py-1 text-[11px] text-ink/80 transition hover:border-accent/50 hover:text-accent"
              >
                {VIEW_MODE_LABELS[mode]}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      <footer className="mt-16 border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between">
          <p>
            {SITE.title} v{SITE.version} — {SITE.subtitle}
          </p>
          <p>
            <Link href="/immersive/" className="text-accent hover:underline">
              回到山上沉浸閱讀
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

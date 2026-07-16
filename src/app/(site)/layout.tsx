import Link from "next/link";
import { SITE } from "@/lib/catalog";

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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
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
                className="hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/" className="hover:text-accent transition-colors">
              知識庫
            </Link>
          </nav>
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

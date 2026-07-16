import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/catalog";

const sans = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const serif = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-serif-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.title}｜${SITE.englishTitle}`,
    template: `%s｜${SITE.title}`,
  },
  description: SITE.description,
};

const nav = [
  { href: "/", label: "首頁" },
  { href: "/toc/", label: "目錄" },
  { href: "/maps/", label: "思想地圖" },
  { href: "/figures/", label: "人物" },
  { href: "/terms/", label: "名詞" },
  { href: "/themes/", label: "主題" },
  { href: "/search/", label: "搜尋" },
  { href: "/ai/", label: "莊子 AI" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <div className="min-h-screen">
          <header className="border-b border-line/80 bg-paper/80 backdrop-blur sticky top-0 z-40">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" className="font-serif text-lg tracking-wide text-ink">
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
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
          <footer className="border-t border-line mt-16">
            <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted flex flex-col gap-2 sm:flex-row sm:justify-between">
              <p>
                {SITE.title} v{SITE.version} — {SITE.subtitle}
              </p>
              <p>內容採版本化開發：V0.1 骨架 → V1.0 出版版</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

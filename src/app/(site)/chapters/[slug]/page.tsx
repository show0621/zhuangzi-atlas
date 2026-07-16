import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CHAPTERS, getChapterBySlug } from "@/lib/catalog";
import { readChapter } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const meta = getChapterBySlug(decodeURIComponent(slug));
  if (!meta) return { title: "篇章" };
  return {
    title: `〈${meta.title}〉`,
    description: meta.summary,
  };
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const meta = getChapterBySlug(decoded);
  if (!meta) notFound();

  const doc = readChapter(meta);
  if (!doc) notFound();

  const idx = CHAPTERS.findIndex((c) => c.slug === meta.slug);
  const prev = idx > 0 ? CHAPTERS[idx - 1] : null;
  const next = idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;

  return (
    <article className="space-y-8">
      <header className="space-y-3 border-b border-line pb-6">
        <p className="text-sm text-muted">
          <Link href="/toc/" className="hover:text-accent">
            目錄
          </Link>
          <span className="mx-2">/</span>
          {meta.part}
          <span className="mx-2">/</span>
          {meta.id}
        </p>
        <h1 className="font-serif text-4xl tracking-wide">〈{meta.title}〉</h1>
        <p className="text-muted max-w-2xl">{meta.summary}</p>
        <p className="text-xs text-muted">
          狀態：{doc.frontmatter.status}
          {doc.frontmatter.updated ? ` · 更新 ${doc.frontmatter.updated}` : ""}
        </p>
      </header>

      <div className="prose-zhuangzi">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
      </div>

      <nav className="flex flex-col sm:flex-row justify-between gap-3 border-t border-line pt-6 text-sm">
        {prev ? (
          <Link href={`/chapters/${prev.slug}/`} className="text-accent hover:underline">
            ← 〈{prev.title}〉
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/chapters/${next.slug}/`} className="text-accent hover:underline sm:text-right">
            〈{next.title}〉 →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}

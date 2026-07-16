import { notFound } from "next/navigation";
import { CHAPTERS, getChapterBySlug } from "@/lib/catalog";
import { readChapter } from "@/lib/content";
import { ImmersiveReaderShell } from "@/components/immersive/ImmersiveReaderShell";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  // Include both raw CJK and URI-encoded forms for export + Turbopack quirks.
  const params: { slug: string }[] = [];
  for (const c of CHAPTERS) {
    params.push({ slug: c.slug });
    const encoded = encodeURIComponent(c.slug);
    if (encoded !== c.slug) params.push({ slug: encoded });
  }
  return params;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const meta = getChapterBySlug(decodeURIComponent(slug));
  if (!meta) return { title: "沉浸閱讀" };
  return {
    title: `山上讀〈${meta.title}〉`,
    description: meta.summary,
  };
}

export default async function ImmersiveChapterPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const meta = getChapterBySlug(decoded);
  if (!meta) notFound();
  const doc = readChapter(meta);
  if (!doc) notFound();

  const chapters = CHAPTERS.map((c) => ({
    slug: c.slug,
    title: c.title.replace(/^導論：/, "導論"),
    part: c.part,
  }));

  return (
    <ImmersiveReaderShell
      slug={meta.slug}
      title={meta.title.replace(/^導論：/, "導論")}
      part={meta.part}
      content={doc.content}
      chapters={chapters}
    />
  );
}

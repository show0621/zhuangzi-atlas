import { CHAPTERS } from "@/lib/catalog";
import { ImmersiveGate } from "@/components/immersive/ImmersiveGate";

export const metadata = {
  title: "山上讀書",
  description: "透明清水、微風拂過的沉浸式《莊子》閱讀體驗。",
};

export default function ImmersiveHomePage() {
  const chapters = CHAPTERS.map((c) => ({
    slug: c.slug,
    title: c.title.replace(/^導論：/, "導論 · "),
    part: c.part,
  }));

  return <ImmersiveGate chapters={chapters} />;
}

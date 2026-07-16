import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const isProdBuild = process.env.NODE_ENV === "production";
// Export for `next build` / Pages; skip in `next dev` so Turbopack doesn't
// falsely require generateStaticParams on every dynamic navigation.
const forceStaticExport =
  isProdBuild ||
  isGithubPages ||
  process.env.STATIC_EXPORT === "true";
const basePath = isGithubPages ? "/zhuangzi-atlas" : "";

const nextConfig: NextConfig = {
  ...(forceStaticExport ? { output: "export" as const } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;

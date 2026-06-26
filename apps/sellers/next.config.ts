import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer is browser-only (PDFKit). Transpile it into the bundle so
  // Turbopack doesn't externalize it into the SSR graph (where it can't resolve).
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;

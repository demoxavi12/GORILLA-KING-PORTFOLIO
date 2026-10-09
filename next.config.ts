import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: path.resolve(".") },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80],
  },
};

export default nextConfig;

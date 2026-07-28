import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cognitive-engine/shared", "@cognitive-engine/ui"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Remove assetPrefix to let Vercel handle it automatically
  basePath: process.env.NODE_ENV === 'production' ? '' : undefined,
};

export default nextConfig;

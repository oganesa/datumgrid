import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // pdfjs-dist requires "canvas" for Node.js server-side rendering — stub it out
      canvas: "./lib/empty-module.js",
    },
  },
  webpack: (config) => {
    // Same stub for production webpack builds
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;

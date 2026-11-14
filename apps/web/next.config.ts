import path from "node:path";
import type { NextConfig } from "next";
import { env } from "./lib/env";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${env.API_URL}/api/:path*` }];
  },
  experimental: {
    agentFeedback: true,
  },
  transpilePackages: ["@focuslog/shared"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: path.join(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

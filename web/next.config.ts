import type { NextConfig } from "next";

const apiUrl = process.env.API_URL;

if (!apiUrl && process.env.NODE_ENV === "production") {
  throw new Error("API_URL is required in production");
}

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl ?? "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

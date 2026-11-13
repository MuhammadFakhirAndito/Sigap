import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/_design",
        destination: "/design",
      },
    ];
  },
};

export default nextConfig;

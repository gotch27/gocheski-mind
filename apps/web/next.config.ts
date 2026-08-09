import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/mind" : "");

const nextConfig: NextConfig = {
  basePath,
  allowedDevOrigins: ["192.168.1.160"],
  transpilePackages: ["@gocheski-mind/contracts"],
  async headers() {
    return [
      {
        source: "/mind-demo-v1.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/mind-demo-mobile-v1.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/mind-demo-poster-v1.jpg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      }
    ];
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

export default nextConfig;

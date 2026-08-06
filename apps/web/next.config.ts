import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/mind" : "");

const nextConfig: NextConfig = {
  basePath,
  allowedDevOrigins: ["192.168.1.160"],
  transpilePackages: ["@gocheski-mind/contracts"],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

export default nextConfig;

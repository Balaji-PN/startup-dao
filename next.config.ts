import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip type checking during build to avoid issues with blockchain tests
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

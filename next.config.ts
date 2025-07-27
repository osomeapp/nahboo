import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disable ESLint during builds for testing
  },
};

export default nextConfig;

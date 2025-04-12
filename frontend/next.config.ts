import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*'
      }
    ];
  },
  // This is handled in the package.json scripts, but adding here for clarity
  // The actual port config will come from the start command
  devIndicators: {
    buildActivity: true,
  }
};

export default nextConfig;

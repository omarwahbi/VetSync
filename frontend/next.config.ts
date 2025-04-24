import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL || 'http://localhost:3000/api/:path*',
        // Add header configuration to preserve credentials
        has: [
          {
            type: 'header',
            key: 'origin',
          },
        ],
      }
    ];
  },
  // This is handled in the package.json scripts, but adding here for clarity
  // The actual port config will come from the start command
  
  // Enable standalone output for Docker production deployment
  output: 'standalone',
};

export default nextConfig;

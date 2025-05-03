import nextIntl from 'next-intl/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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

  // Enable standalone output for Docker production deployment
  output: 'standalone',

  // Add favicon configuration
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

// Use nextIntl to extend your configuration with the next-intl plugin
const withNextIntl = nextIntl('./src/i18n.ts');

export default withNextIntl(nextConfig); 
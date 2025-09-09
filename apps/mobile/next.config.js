/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
  // Removed rewrites - using API routes for proxy instead
};

module.exports = withPWA(nextConfig);
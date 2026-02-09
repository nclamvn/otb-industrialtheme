/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: Output standalone for Azure
  output: 'standalone',

  // Disable image optimization (không dùng Vercel)
  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  experimental: {},
};

export default nextConfig;

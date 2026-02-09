/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Azure App Services
  output: 'standalone',

  // Disable image optimization (không dùng Vercel)
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;

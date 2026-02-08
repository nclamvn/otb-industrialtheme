/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Azure App Services: standalone output ───
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

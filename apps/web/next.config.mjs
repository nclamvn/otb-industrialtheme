import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // =====================================================
  // PERFORMANCE
  // =====================================================

  // Enable standalone output for Docker/production only
  // Comment out for local development if having issues
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),

  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // Optimize production builds
  swcMinify: true,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (keep error and warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Compress responses
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Reduce powered-by header exposure
  poweredByHeader: false,

  // =====================================================
  // IMAGE OPTIMIZATION
  // =====================================================

  images: {
    domains: ['cdn.dafc.com', 'images.dafc.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // =====================================================
  // CACHING & SECURITY HEADERS
  // =====================================================

  async headers() {
    return [
      // Static assets - long cache
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Fonts - very long cache
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes - no cache by default
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [];
  },

  // =====================================================
  // WEBPACK OPTIMIZATION
  // =====================================================

  webpack: (config, { dev, isServer }) => {
    // Ignore punycode deprecation warning
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
    ];

    // Client-side production optimizations only
    if (!dev && !isServer) {
      // Extend existing splitChunks config for heavy libraries
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Separate chunk for recharts (large library)
          recharts: {
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            name: 'recharts',
            chunks: 'async',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Separate chunk for visx visualization
          visx: {
            test: /[\\/]node_modules[\\/]@visx[\\/]/,
            name: 'visx',
            chunks: 'async',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Separate chunk for date-fns
          dateFns: {
            test: /[\\/]node_modules[\\/]date-fns[\\/]/,
            name: 'date-fns',
            chunks: 'async',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Separate chunk for framer-motion
          framerMotion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-motion',
            chunks: 'async',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Radix UI components
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            chunks: 'async',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'async',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Ignore specific modules on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }

    // Don't bundle server-only modules for client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        child_process: false,
      };
    }

    return config;
  },

  // =====================================================
  // EXPERIMENTAL FEATURES
  // =====================================================

  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize package imports - tree shake these heavy libraries
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-icons',
      'lodash',
      'lodash-es',
      '@visx/axis',
      '@visx/group',
      '@visx/heatmap',
      '@visx/hierarchy',
      '@visx/responsive',
      '@visx/sankey',
      '@visx/scale',
      '@visx/shape',
      '@visx/tooltip',
      'framer-motion',
    ],
    // Mark server-only packages - prevent bundling in client
    serverComponentsExternalPackages: [
      'handlebars',
      'bcryptjs',
      'bcrypt',
      '@prisma/client',
      'prisma',
      'nodemailer',
    ],
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));

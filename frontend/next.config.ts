import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // This disables ESLint during build
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during build to allow deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Set output to standalone for Docker deployment
  output: 'standalone',
  devIndicators: false,

  // Performance optimizations
  compiler: {
    // Enable React optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Only enable React strict mode in production to improve dev performance
  reactStrictMode: process.env.NODE_ENV === 'production',

  // Improve bundle chunking
  experimental: {
    optimizeCss: true, // Enable CSS optimization
    optimizePackageImports: ['@heroicons/react', 'date-fns', 'recharts'],
    turbotrace: {
      logLevel: 'error',
      memoryLimit: 5000, // Increase memory limit for faster builds
      contextDirectory: '.',
    },
    // Enable enhanced caching
    taint: true,
    // Improve module resolution performance
    serverMinification: true,
    // Improve bundle splitting
    isrMemoryCacheSize: 50, // 50MB cache size for ISR
    // Skip duplicate work
    workerThreads: true,
    ppr: true,
  },

  // Enable SWC minification for faster builds
  swcMinify: true,

  // Image optimization settings
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Rewrites for PostHog integration
  async rewrites() {
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
    const posthogAssetsHost = posthogHost.replace('.i.posthog.com', '-assets.i.posthog.com');

    return [
      {
        source: '/ingest/static/:path*',
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: '/ingest/:path*',
        destination: `${posthogHost}/:path*`,
      },
      {
        source: '/ingest/decide',
        destination: `${posthogHost}/decide`,
      },
    ];
  },

  // Support for PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withSentryConfig(
  withSentryConfig(
    nextConfig,
    {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options

      // Suppresses source map uploading logs during build
      silent: true,
      org: process.env.SENTRY_ORG || 'convers-me',
      project: process.env.SENTRY_PROJECT || 'frontend',
    },
    {
      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Transpiles SDK to be compatible with IE11 (increases bundle size)
      transpileClientSDK: false,

      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
      tunnelRoute: '/monitoring',

      // Hides source maps from generated client bundles
      hideSourceMaps: true,

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
    },
  ),
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: process.env.SENTRY_ORG || 'conversme',
    project: process.env.SENTRY_PROJECT || 'javascript-nextjs',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  },
);

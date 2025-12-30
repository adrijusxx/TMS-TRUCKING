/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Note: pdf-parse is only used in API routes (server-side),
  // so no special webpack/turbopack configuration is needed
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // For Turbopack (Next.js 16), source map warnings are common in dev mode
  // These are warnings and don't affect functionality

  // Note: Turbopack is enabled by default in Next.js 16
  // The experimental.turbo option is no longer valid

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Configure basePath for subdirectory deployment (e.g., /tms) or empty for subdomain deployment
  // For subdomain deployment (tms.vaidera.eu): set NEXT_PUBLIC_BASE_PATH='' or don't set it
  // For subdirectory deployment (domain.com/tms): set NEXT_PUBLIC_BASE_PATH='/tms'
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Ensure assetPrefix matches basePath for proper static asset serving
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // REQUIRED for AWS EC2 Deployment
  output: 'standalone',
}

module.exports = nextConfig


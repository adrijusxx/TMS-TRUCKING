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
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Configure basePath for /tms subdirectory when running behind nginx
  // IMPORTANT: When using this, REMOVE the rewrite rule from nginx config
  // Set NEXT_PUBLIC_BASE_PATH=/tms in your .env file when deploying behind nginx
  // Leave empty for local development (or set to empty string)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Ensure assetPrefix matches basePath for proper static asset serving
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

module.exports = nextConfig


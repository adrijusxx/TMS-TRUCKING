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
  
  // Note: We don't need basePath because Nginx rewrite rules handle /tms prefix
  // The rewrite rule strips /tms before passing to Next.js
}

module.exports = nextConfig


/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@bist-elite/shared', '@bist-elite/ui'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
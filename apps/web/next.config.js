/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cv-generator/ui', '@cv-generator/types', '@cv-generator/utils'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cv-generator/ui', '@cv-generator/types', '@cv-generator/utils', 'puppeteer-core'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Resolve puppeteer issue by ignoring problematic files
    if (!isServer) {
      config.resolve.alias['puppeteer-core'] = 'puppeteer-core/lib/cjs/puppeteer/api'
    }
    
    return config
  },
};

module.exports = nextConfig;
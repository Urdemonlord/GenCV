/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@cv-generator/ui', 
    '@cv-generator/types', 
    '@cv-generator/utils', 
    '@cv-generator/lib-ai',
    'puppeteer-core',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  experimental: {
    esmExternals: 'loose',
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    // Resolve puppeteer issue by ignoring problematic files
    if (!isServer) {
      config.resolve.alias['puppeteer-core'] = 'puppeteer-core/lib/cjs/puppeteer/api'
      
      // Prevent Google AI SDKs from being included in client bundles
      config.resolve.alias['@google/genai'] = false
      config.resolve.alias['@google/generative-ai'] = false
    }
    
    return config
  },
};

module.exports = nextConfig;
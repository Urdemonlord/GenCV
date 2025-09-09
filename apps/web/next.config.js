/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@cv-generator/ui', 
    '@cv-generator/types', 
    '@cv-generator/utils', 
    '@cv-generator/lib-ai',
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
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium']
  },
  webpack: (config, { isServer }) => {
    // Resolve puppeteer issue by ignoring problematic files
    if (!isServer) {
      config.resolve.alias['puppeteer-core'] = false
      config.resolve.alias['@sparticuz/chromium'] = false
      
      // Prevent Google AI SDKs from being included in client bundles
      config.resolve.alias['@google/genai'] = false
      config.resolve.alias['@google/generative-ai'] = false
    }
    
    // Membuat puppeteer-core dan @sparticuz/chromium sebagai external module di server
    if (isServer) {
      const nodeExternals = ['puppeteer-core', '@sparticuz/chromium']
      
      // Menambahkan ke externals yang sudah ada
      const externals = [...(config.externals || [])];
      externals.push((context, request, callback) => {
        if (nodeExternals.includes(request)) {
          // Externalize ke commonjs module
          return callback(null, `commonjs ${request}`);
        }
        // Lanjutkan untuk modul lain
        callback();
      });
      
      config.externals = externals;
    }
    
    return config
  },
};

module.exports = nextConfig;

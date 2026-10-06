/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@cv-generator/ui',
    '@cv-generator/types',
    '@cv-generator/utils',
  ],
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
    if (!isServer) {
      // Keep the server-only Google AI SDK out of client bundles
      config.resolve.alias['@google/genai'] = false
      // pdf.js references the Node-only `canvas` package; the browser never needs it
      config.resolve.alias['canvas'] = false
    }

    return config
  },
};

module.exports = nextConfig;

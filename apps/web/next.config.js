/** @type {import('next').NextConfig} */
const nextConfig = {
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

// Export all shared utilities that work in any environment
export * from './shared';

// Export browser-specific utilities (these will be tree-shaken out in Node.js environments)
export * from './browser';
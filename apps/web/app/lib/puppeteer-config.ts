import fs from 'fs';
import path from 'path';
import os from 'os';

// Chrome binaries by platform
const CHROME_PATHS = {
  win32: [
    process.env.PUPPETEER_EXECUTABLE_PATH, // Bisa diset dari .env.development
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${os.homedir()}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
  ],
  darwin: [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ],
};

// Helper function to check if file exists
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Find local Chrome installation
function findLocalChrome(): string | null {
  const platform = process.platform as 'win32' | 'darwin' | 'linux';
  const paths = CHROME_PATHS[platform] || [];

  for (const path of paths) {
    if (path && fileExists(path)) {
      console.log(`Found local Chrome at: ${path}`);
      return path;
    }
  }

  return null;
}

// Initialize font directories for Chrome
export async function initChromeFonts(): Promise<void> {
  // Skip font initialization in Vercel environment
  if (process.env.VERCEL) {
    console.log('Skipping font initialization in Vercel environment');
    return;
  }

  try {
    // Dynamically import fs and path to avoid bundling issues
    const fs = await import('fs');
    const path = await import('path');

    // Check if public/fonts directory exists
    const fontsPath = path.join(process.cwd(), 'public', 'fonts');
    
    if (fs.existsSync(fontsPath)) {
      console.log(`Found fonts directory at: ${fontsPath}`);
      // Fonts will be loaded automatically when using standard fonts
    } else {
      // Create the directory if it doesn't exist
      fs.mkdirSync(fontsPath, { recursive: true });
      console.log(`Created fonts directory at: ${fontsPath}`);
    }
    
    console.log('Chrome fonts initialized successfully');
  } catch (error) {
    console.warn('Warning: Font initialization issue:', error);
  }
}

// Get Puppeteer configuration
export async function getPuppeteerConfig() {
  console.log('Getting puppeteer config...');
  console.log('Environment:', process.env.VERCEL ? 'Vercel' : 'Local');

  // Vercel serverless environment configuration
  if (process.env.VERCEL) {
    try {
      console.log('Using @sparticuz/chromium for Vercel environment');
      // Import dynamically to avoid webpack bundling issues
      const chromium = await import('@sparticuz/chromium');
      
      return {
        args: chromium.default.args,
        defaultViewport: { width: 1200, height: 1600, deviceScaleFactor: 2 },
        executablePath: await chromium.default.executablePath(),
        headless: true,
        ignoreHTTPSErrors: true,
      };
    } catch (error) {
      console.error('Error configuring Puppeteer for Vercel:', error);
      throw new Error(`Failed to configure Puppeteer for Vercel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Try installing puppeteer (non-core) for local development if configuration fails
  if (process.env.NODE_ENV === 'development') {
    try {
      console.log('Trying to use normal puppeteer for local development...');
      
      // Check if puppeteer is installed and use it as fallback
      try {
        const puppeteer = await import('puppeteer');
        // Get the executable path dari Puppeteer 
        console.log('Using puppeteer for development environment');
        
        return {
          // Gunakan default Puppeteer behavior
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          ignoreHTTPSErrors: true,
          defaultViewport: { width: 1200, height: 1600, deviceScaleFactor: 2 }
        };
      } catch (e) {
        console.log('Regular puppeteer not available, continuing with puppeteer-core...');
      }
    } catch (error) {
      console.log('Failed to use puppeteer fallback:', error);
      // Continue to try with puppeteer-core
    }
  }

  // Default configuration for local environment
  const config: any = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--font-render-hinting=none', // Improves font consistency
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2, // Higher DPI for better quality
    }
  };

  try {
    // Try to find local Chrome first
    const localChromePath = findLocalChrome();
    
    if (localChromePath) {
      console.log('Using local Chrome installation');
      config.executablePath = localChromePath;
      return config;
    }
    
    // Jika tidak menemukan Chrome lokal, berikan error yang jelas
    console.error('No Chrome installation found. Puppeteer-core requires an executable path.');
    throw new Error('Chrome executable not found. Please install Chrome or set PUPPETEER_EXECUTABLE_PATH environment variable.');
    
  } catch (error) {
    console.error('Error configuring Puppeteer:', error);
    throw new Error(`Failed to configure Puppeteer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

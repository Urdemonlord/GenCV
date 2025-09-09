import fs from 'fs';
import path from 'path';
import os from 'os';

// Chrome binaries by platform
const CHROME_PATHS = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${os.homedir()}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
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
    if (fileExists(path)) {
      console.log(`Found local Chrome at: ${path}`);
      return path;
    }
  }

  return null;
}

// Initialize font directories for Chrome
export function initChromeFonts(): void {
  try {
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
  // Vercel serverless environment configuration
  if (process.env.VERCEL) {
    try {
      // Import dynamically to avoid issues in development environment
      const chromium = await import('@sparticuz/chromium');
      console.log('Using @sparticuz/chromium for Vercel environment');
      
      return {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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
    
    // If no local Chrome, try puppeteer's default
    console.log('No local Chrome found, using bundled Chromium');
    return config;
    
  } catch (error) {
    console.error('Error configuring Puppeteer:', error);
    throw new Error(`Failed to configure Puppeteer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

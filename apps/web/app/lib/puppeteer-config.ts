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
  console.log('Chrome fonts initialized');
  // No need to actually initialize fonts with regular puppeteer
}

// Get Puppeteer configuration
export async function getPuppeteerConfig() {
  // Default configuration
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
    ],
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

import path from 'path';
import os from 'os';
import fs from 'fs';
import chrome from '@sparticuz/chromium';

// Function to check if a file exists
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Platform-specific executable paths for local Chrome/Chromium
const localChromePaths = {
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
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ],
};

// Get local Chrome executable path based on platform
export function getLocalChromePath(): string | null {
  const platform = process.platform as keyof typeof localChromePaths;
  const paths = localChromePaths[platform] || [];

  for (const browserPath of paths) {
    if (fileExists(browserPath)) {
      return browserPath;
    }
  }
  
  return null;
}

// Configure puppeteer launch options
export async function getPuppeteerConfig() {
  // Try to use a local Chrome installation first
  const localChromePath = getLocalChromePath();
  
  // Fallback to @sparticuz/chromium if no local Chrome found
  let executablePath = localChromePath;
  
  if (!executablePath) {
    try {
      executablePath = await chrome.executablePath('local');
      console.log('Using @sparticuz/chromium local path');
    } catch (error) {
      console.error('Error getting chromium local path:', error);
      try {
        // Final fallback
        executablePath = await chrome.executablePath();
        console.log('Using @sparticuz/chromium default path');
      } catch (error) {
        console.error('Error getting chromium default path:', error);
        throw new Error('Failed to find a valid Chrome executable path');
      }
    }
  } else {
    console.log('Using local Chrome installation');
  }

  // Basic puppeteer launch options
  return {
    args: [
      ...chrome.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--single-process',
    ],
    executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  };
}

// Initialize chrome fonts
export async function initChromeFonts() {
  try {
    await chrome.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');
    console.log('Chrome fonts initialized');
  } catch (error) {
    console.warn('Failed to initialize Chrome fonts:', error);
    // Continue without custom fonts if loading fails
  }
}

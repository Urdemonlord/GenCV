import { CVData } from '@cv-generator/types';

// Server-only utilities (no DOM dependencies)
// Placeholder functions for server environment
export const saveToLocalStorage = (key: string, data: CVData): void => {
  console.warn('localStorage is not available in server environment');
};

export const loadFromLocalStorage = (key: string): CVData | null => {
  console.warn('localStorage is not available in server environment');
  return null;
};

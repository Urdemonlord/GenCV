import { CVData } from '@cv-generator/types';

// Browser-only utilities that require DOM/window
export const saveToLocalStorage = (key: string, data: CVData): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  } else {
    console.warn('localStorage is not available');
  }
};

export const loadFromLocalStorage = (key: string): CVData | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  } else {
    console.warn('localStorage is not available');
    return null;
  }
};

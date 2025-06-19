// Server-safe exports only (no DOM dependencies)
export {
  generateId,
  formatDate,
  validateEmail,
  validatePhone,
  calculateCVScore,
  sanitizeInput,
  exportToJSON,
  importFromJSON
} from './index';

// Server-safe versions of localStorage functions
import { CVData } from '@cv-generator/types';

export const saveToLocalStorage = (key: string, data: CVData): void => {
  console.warn('localStorage is not available in server environment');
};

export const loadFromLocalStorage = (key: string): CVData | null => {
  console.warn('localStorage is not available in server environment');
  return null;
};

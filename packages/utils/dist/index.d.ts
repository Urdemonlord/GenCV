import { CVData } from '@cv-generator/types';

// Type definitions for @cv-generator/utils


declare function loadFromLocalStorage(key: string): any;
declare function saveToLocalStorage(key: string, data: any): void;
declare function exportToJSON(data: any): string;
declare function importFromJSON(jsonString: string): any;
declare function calculateCompletenessScore(cvData: CVData): number;
declare function calculateCVScore(cvData: CVData): { 
  score: number; 
  overall: number;
  suggestions: string[];
  sections: Record<string, number>;
};
declare function formatDate(dateString: string): string;
declare function generateId(): string;
declare function validateEmail(email: string): boolean;
declare function validatePhone(phone: string): boolean;

export { calculateCVScore, calculateCompletenessScore, exportToJSON, formatDate, generateId, importFromJSON, loadFromLocalStorage, saveToLocalStorage, validateEmail, validatePhone };

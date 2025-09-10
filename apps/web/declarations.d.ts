declare module '@cv-generator/utils' {
  import { CVData } from '@cv-generator/types';
  
  export function loadFromLocalStorage(key: string): any;
  export function saveToLocalStorage(key: string, data: any): void;
  export function exportToJSON(data: any): string;
  export function importFromJSON(jsonString: string): any;
  export function calculateCompletenessScore(cvData: CVData): number;
  export function calculateCVScore(cvData: CVData): { 
    score: number; 
    overall: number;
    suggestions: string[];
    sections: Record<string, number>;
  };
  export function formatDate(dateString: string): string;
  export function generateId(): string;
  export function validateEmail(email: string): boolean;
  export function validatePhone(phone: string): boolean;
}

declare module '@cv-generator/utils/browser' {
  import { CVData } from '@cv-generator/types';
  
  export function generatePDF(templateName: string, cvData: any): Promise<Blob>;
  export function downloadPDF(blob: Blob, filename: string): void;
  export function loadFromLocalStorage(key: string): any;
}

declare module '@cv-generator/utils/server' {
  // Server-specific utilities
}

declare module '@cv-generator/utils/shared' {
  // Shared utilities
}

declare module 'pdfkit';

// Type definitions for @cv-generator/utils/browser
import { CVData } from '@cv-generator/types';

export function generatePDF(templateName: string, cvData: any): Promise<Blob>;
export function downloadPDF(blob: Blob, filename: string): void;
export function loadFromLocalStorage(key: string): any;

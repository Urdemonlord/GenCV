// Type definitions for @cv-generator/utils/browser


declare function generatePDF(templateName: string, cvData: any): Promise<Blob>;
declare function downloadPDF(blob: Blob, filename: string): void;
declare function loadFromLocalStorage(key: string): any;

export { downloadPDF, generatePDF, loadFromLocalStorage };

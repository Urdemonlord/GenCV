'use client';

import { CVData } from '@cv-generator/types';

/**
 * Download a PDF from the external backend.
 * Throws an error if the response is not a valid PDF.
 */
export async function downloadPDF(
  cvData: CVData,
  template: string,
  filenameHint?: string
): Promise<void> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const response = await fetch(`${apiUrl}/api/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({ cvData, template }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server error ${response.status}: ${text}`);
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = filenameHint || 'cv.pdf';
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  if (match && match[1]) {
    filename = match[1];
  }

  const blob = await response.blob();

  // Validate PDF signature
  const signatureBytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  let signature = '';
  signatureBytes.forEach((b) => {
    signature += String.fromCharCode(b);
  });

  if (signature !== '%PDF-' || blob.type !== 'application/pdf') {
    throw new Error(`Invalid PDF response (signature: ${signature}, type: ${blob.type})`);
  }

  if (blob.size < 1000) {
    throw new Error(`PDF file too small (${blob.size} bytes)`);
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}


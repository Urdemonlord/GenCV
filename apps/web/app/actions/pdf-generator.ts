// PDF generation via Server Action
'use server';

import { CVData } from '@cv-generator/types';

// Main function to generate a PDF
export async function generatePDF(cvData: CVData, template: string): Promise<{ 
  buffer: Buffer; 
  isText: boolean;
  filename: string;
}> {
  const fullName = cvData.personalInfo?.fullName || 'cv';
  const safeFilename = fullName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://gencvbackend-web.vercel.app').replace(/\/$/, '');
    console.log('Requesting PDF generation from backend:', apiUrl);

    const response = await fetch(`${apiUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/pdf'
      },
      body: JSON.stringify({ cvData, template })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Backend error ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Extract filename from response headers if provided
    const contentDisposition = response.headers.get('Content-Disposition');
    let serverFilename = `${safeFilename}.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match && match[1]) {
        serverFilename = match[1];
      }
    }

    return {
      buffer: pdfBuffer,
      isText: false,
      filename: serverFilename
    };
  } catch (error) {
    // Fall back to PDFKit-based text PDF
    console.error('Remote PDF generation failed, using fallback:', error);

    const textContent = `
CV - ${cvData.personalInfo?.fullName || 'Unnamed'}
===============================

PERSONAL INFORMATION
-------------------
Name: ${cvData.personalInfo?.fullName || ''}
Email: ${cvData.personalInfo?.email || ''}
Phone: ${cvData.personalInfo?.phone || ''}
Location: ${cvData.personalInfo?.location || ''}

PROFESSIONAL SUMMARY
-------------------
${cvData.professionalSummary || ''}

EXPERIENCE
---------
${cvData.experience?.map(exp =>
  `• ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})
   ${exp.description}`
).join('\n\n') || ''}

EDUCATION
--------
${cvData.education?.map(edu =>
  `• ${edu.degree} from ${edu.institution} (${edu.startDate} - ${edu.endDate})
   ${edu.field}`
).join('\n\n') || ''}

SKILLS
------
${cvData.skills?.join(', ') || ''}

PROJECTS
--------
${cvData.projects?.map(project =>
  `• ${project.name || ''}
   ${project.description || ''}`
).join('\n\n') || ''}

This CV was generated using a basic PDF fallback because the primary
PDF generation failed. For full fidelity, please try again later.
`;

    // Use standalone build to ensure standard fonts are bundled
    const { default: PDFDocument } = await import('pdfkit/js/pdfkit.standalone.js');
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    const pdfBufferPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    doc.fontSize(12).text(textContent);
    doc.end();

    const pdfBuffer = await pdfBufferPromise;

    return {
      buffer: pdfBuffer,
      isText: false,
      filename: `${safeFilename}.pdf`
    };
  }
}

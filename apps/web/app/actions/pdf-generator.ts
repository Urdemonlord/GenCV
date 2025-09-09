// PDF generation via Server Action
'use server';

import { CVData } from '@cv-generator/types';
import { generateHTML } from '@/lib/html-generator';
import PDFDocument from 'pdfkit';

// Main function to generate a PDF
export async function generatePDF(cvData: CVData, template: string): Promise<{
  buffer: Buffer;
  isText: boolean;
  filename: string;
}> {
  const fullName = cvData.personalInfo?.fullName || 'cv';
  const safeFilename = fullName.replace(/[^a-zA-Z0-9.-]/g, '_');

  try {
    try {
      console.log('Starting PDF generation process...');
      let puppeteer;
      let usedPuppeteerType = 'puppeteer-core';

      if (process.env.NODE_ENV === 'development') {
        try {
          const puppeteerModule = await import('puppeteer');
          puppeteer = puppeteerModule.default;
          usedPuppeteerType = 'puppeteer';
          console.log('Using regular puppeteer for PDF generation in development');
        } catch (err) {
          console.log('Regular puppeteer not available, falling back to puppeteer-core');
          const puppeteerCoreModule = await import('puppeteer-core');
          puppeteer = puppeteerCoreModule.default;
        }
      } else {
        const puppeteerCoreModule = await import('puppeteer-core');
        puppeteer = puppeteerCoreModule.default;
        console.log('Using puppeteer-core for PDF generation in production');
      }

      const { getPuppeteerConfig, initChromeFonts } = await import('@/lib/puppeteer-config');
      console.log('Generating PDF with', usedPuppeteerType);
      const html = await generateHTML(cvData, template);
      await initChromeFonts();
      const puppeteerConfig = await getPuppeteerConfig();
      console.log('Launching browser with config:', JSON.stringify({
        executablePath: puppeteerConfig.executablePath ? 'Set' : 'Not set',
        headless: puppeteerConfig.headless || 'unknown',
        args: puppeteerConfig.args?.length || 0,
      }));
      const browser = await puppeteer.launch(puppeteerConfig);
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfData = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
          preferCSSPageSize: true,
        });

        const pdfBuffer = Buffer.from(pdfData);
        const signature = pdfBuffer.slice(0, 5).toString('utf-8');
        if (!signature.startsWith('%PDF')) {
          throw new Error(`Invalid PDF signature: ${signature}`);
        }

        return { buffer: pdfBuffer, isText: false, filename: `${safeFilename}.pdf` };
      } finally {
        await browser.close();
      }
    } catch (puppeteerError) {
      console.error('Puppeteer PDF generation failed:', puppeteerError);
      throw puppeteerError;
    }
  } catch (error) {
    // Fallback using pdfkit to still return a PDF file
    console.log('Using PDFKit fallback due to error:', error);

    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', (data: Buffer) => buffers.push(data));

    const textContent = `CV - ${cvData.personalInfo?.fullName || 'Unnamed'}\n\n
PERSONAL INFORMATION
Name: ${cvData.personalInfo?.fullName || ''}
Email: ${cvData.personalInfo?.email || ''}
Phone: ${cvData.personalInfo?.phone || ''}
Location: ${cvData.personalInfo?.location || ''}

PROFESSIONAL SUMMARY
${cvData.professionalSummary || ''}

EXPERIENCE
${cvData.experience?.map(exp =>
  `• ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})
   ${exp.description}`
).join('\n\n') || ''}

EDUCATION
${cvData.education?.map(edu =>
  `• ${edu.degree} from ${edu.institution} (${edu.startDate} - ${edu.endDate})
   ${edu.field}`
).join('\n\n') || ''}

SKILLS
${cvData.skills?.join(', ') || ''}

PROJECTS
${cvData.projects?.map(project =>
  `• ${project.name || ''}
   ${project.description || ''}`
).join('\n\n') || ''}

This CV was generated using a simplified PDF fallback because full PDF generation failed.`;

    doc.fontSize(12).text(textContent);
    doc.end();

    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });

    return { buffer: pdfBuffer, isText: false, filename: `${safeFilename}.pdf` };
  }
}

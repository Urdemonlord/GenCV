// PDF generation via Server Action
'use server';

import { CVData } from '@cv-generator/types';
import { generateHTML } from '@/lib/html-generator';
import chromium from '@sparticuz/chromium';

export async function generatePDF(cvData: CVData, template: string): Promise<{ buffer: Buffer; filename: string }> {
  const safeFilename = (cvData.personalInfo?.fullName || 'cv').replace(/[^a-zA-Z0-9.-]/g, '_');
  let browser: any;

  try {
    const html = await generateHTML(cvData, template);

    if (process.env.NODE_ENV === 'development') {
      const puppeteer = (await import('puppeteer')).default;
      browser = await puppeteer.launch({ headless: true });
    } else {
      const puppeteer = (await import('puppeteer-core')).default;
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      preferCSSPageSize: true,
    });

    return { buffer: Buffer.from(pdf), filename: `${safeFilename}.pdf` };
  } catch (error) {
    console.error('Puppeteer PDF generation failed:', error);
    const { default: PDFDocument } = await import('pdfkit/js/pdfkit.standalone.js');
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));

    doc.fontSize(12).text(`CV - ${cvData.personalInfo?.fullName || 'Unnamed'}`);
    doc.end();

    return { buffer: await done, filename: `${safeFilename}.pdf` };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}


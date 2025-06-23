import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import puppeteer from 'puppeteer';
import { sanitizeInput } from '@cv-generator/utils/shared';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const router = Router();

// Gunakan direktori tmp sistem untuk file sementara
const TMP_DIR = path.join(os.tmpdir(), 'cv-generator-pdf');

// Pastikan direktori ada
async function ensureTmpDir() {
  try {
    await fs.mkdir(TMP_DIR, { recursive: true });
    console.log(`PDF temp directory created at ${TMP_DIR}`);
  } catch (err) {
    console.error('Failed to create temp directory:', err);
  }
}

// Ensure the temporary directory is created before handling requests
ensureTmpDir().catch(err => console.error('ensureTmpDir error:', err));

// PDF generation rate limiting
const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 PDF requests per windowMs
  message: 'Too many PDF generation requests, please try again later.',
});

const validatePDFRequest = [
  body('cvData').isObject().withMessage('CV data must be an object'),
  body('template').optional().isString().isLength({ min: 1, max: 50 }).withMessage('Template must be a string'),
];

// Direct PDF Generation - using best practices
router.post('/generate-pdf', pdfLimiter, validatePDFRequest, async (req: Request, res: Response) => {
  let browser = null;
  
  try {
    console.log('PDF Generation started');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { cvData, template } = req.body;
    
    if (!cvData) {
      return res.status(400).json({ 
        success: false, 
        error: 'CV data is required' 
      });
    }
    
    // Generate HTML directly without file operations
    const html = generateHTML(cvData, template);
    console.log('HTML generated, length:', html.length);
    
    // Launch browser with best practices
    browser = await puppeteer.launch({
      headless: true, // Changed from 'new' to `true` to fix TypeScript error. 'new' is for newer puppeteer versions.
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--font-render-hinting=none'
      ]
    });
    
    console.log('Browser launched');
    const page = await browser.newPage();
    
    // Set content directly instead of file operations
    await page.setContent(html, { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
    
    // Ensure print styles are applied
    await page.emulateMediaType('screen');
    console.log('HTML content loaded in browser');
    
    // Generate PDF with proper configuration
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      preferCSSPageSize: false,
    });
    
    console.log('PDF buffer generated, size:', pdfBuffer.length);
    
    // Validate PDF signature
    // Validate PDF binary signature - check bytes: 0x25 50 44 46 2D ("%PDF-")
    const signatureBytes = pdfBuffer.slice(0, 5);
    const signatureHex = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
    const signatureString = String.fromCharCode(...signatureBytes);
    console.log('PDF signature bytes (hex):', signatureHex);
    console.log('PDF signature string:', signatureString);
    
    // Check both hex bytes and string representation
    const expectedBytes = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
    const isValidSignature = expectedBytes.every((byte, i) => signatureBytes[i] === byte);
    
    if (!isValidSignature) {
      console.error('Invalid PDF signature. Expected: 25 50 44 46 2d, Got:', signatureHex);
      await browser.close();
      return res.status(500).json({ 
        success: false, 
        error: 'Generated PDF has invalid signature',
        expectedHex: '25 50 44 46 2d',
        actualHex: signatureHex
      });
    }
    
    // Diagnostic: Save buffer to disk for debugging if needed
    if (process.env.NODE_ENV === 'development') {
      const debugPath = path.join(TMP_DIR, `debug-${Date.now()}.pdf`);
      try {
        await fs.writeFile(debugPath, pdfBuffer);
        console.log(`Debug PDF saved to: ${debugPath} (size: ${pdfBuffer.length} bytes)`);
      } catch (debugErr) {
        console.warn('Could not save debug PDF:', debugErr);
      }
    }
    
    // Validate PDF buffer size - too small indicates corruption
    if (pdfBuffer.length < 1000) {
      console.error('PDF buffer suspiciously small:', pdfBuffer.length, 'bytes');
      await browser.close();
      return res.status(500).json({ 
        success: false, 
        error: 'Generated PDF appears to be corrupted (too small)',
        bufferSize: pdfBuffer.length
      });
    }
      await browser.close();
    browser = null;
      // Generate safe filename - RFC 5987 compliant
    const fullName = cvData.personalInfo?.fullName || 'cv';
    const safeName = fullName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${safeName}.pdf`;
    
    // Encode for Content-Disposition (ASCII-only filename)
    const asciiFilename = encodeURIComponent(fileName).replace(/%20/g, '_');
    
    // Set comprehensive headers to ensure proper binary transfer
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'x-no-compression': '1', // Custom header to signal no compression
      'Access-Control-Expose-Headers': 'Content-Disposition'
    });
    
    // Log response headers for debugging
    const headersSent = res.getHeaders();
    console.log('PDF response headers sent:', headersSent);
    console.log('PDF buffer size sent:', pdfBuffer.length);
    
    // Send PDF buffer directly
    // Ensure the response is sent as a Buffer to avoid JSON serialization
    const bufferToSend = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    res.setHeader('Content-Length', bufferToSend.length);
    res.send(bufferToSend);
    
    console.log('PDF response sent successfully');
    
  } catch (error) {
    console.error('PDF Generation failed:', error);

    // Detailed error logging
    const logFilePath = path.join(TMP_DIR, 'pdf-error.log');
    const errorMessage = error instanceof Error ? error.stack : String(error);
    const logMessage = `[${new Date().toISOString()}] PDF Generation Error:\n${errorMessage}\n\n`;
    
    try {
      await fs.appendFile(logFilePath, logMessage);
      console.log(`Error details logged to ${logFilePath}`);
    } catch (logError) {
      console.error('Failed to write to error log:', logError);
    }

    res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred during PDF generation.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
});

function generateHTML(cvData: any, template?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CV - ${cvData.personalInfo?.fullName || 'Resume'}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          color: #333; 
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        h1 { 
          color: #2563eb; 
          margin-bottom: 5px; 
          font-size: 2.5em;
        }
        h2 { 
          color: #2563eb; 
          border-bottom: 2px solid #e2e8f0; 
          padding-bottom: 5px; 
          margin-top: 30px; 
          margin-bottom: 15px;
        }
        .header { 
          margin-bottom: 30px; 
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .contact-info {
          margin-top: 10px;
          font-size: 1.1em;
          color: #4b5563;
        }
        .section { 
          margin-bottom: 25px; 
          page-break-inside: avoid;
        }
        .job { 
          margin-bottom: 20px; 
          border-left: 3px solid #e2e8f0;
          padding-left: 15px;
        }
        .job-title { 
          font-weight: bold; 
          margin-bottom: 3px; 
          font-size: 1.2em;
          color: #1f2937;
        }
        .job-company { 
          color: #4b5563; 
          font-weight: 500;
          font-size: 1.1em;
        }
        .job-duration { 
          color: #6b7280; 
          font-size: 0.9em; 
          margin: 5px 0;
        }
        .job-description { 
          margin-top: 8px; 
          line-height: 1.6;
        }
        .skills { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 8px; 
          margin-top: 10px;
        }
        .skill { 
          background: #e2e8f0; 
          border-radius: 6px; 
          padding: 6px 12px; 
          font-size: 0.9em;
          color: #374151;
          border: 1px solid #cbd5e1;
        }
        .summary {
          background: #f8fafc;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
          border-radius: 0 6px 6px 0;
        }
        @media print {
          body { margin: 0; padding: 10mm; }
          .header { page-break-after: avoid; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${cvData.personalInfo?.fullName || ''}</h1>
        <div style="font-size: 1.3em; color: #4b5563; margin: 5px 0;">${cvData.personalInfo?.title || ''}</div>
        <div class="contact-info">
          ${cvData.personalInfo?.email ? `${cvData.personalInfo.email}` : ''}
          ${cvData.personalInfo?.phone ? ` | ${cvData.personalInfo.phone}` : ''}
          ${cvData.personalInfo?.location ? ` | ${cvData.personalInfo.location}` : ''}
        </div>
      </div>

      ${cvData.professionalSummary ? `
        <div class="section">
          <h2>Professional Summary</h2>
          <div class="summary">
            <p>${cvData.professionalSummary}</p>
          </div>
        </div>
      ` : ''}

      ${cvData.experience && cvData.experience.length > 0 ? `
        <div class="section">
          <h2>Experience</h2>
          ${cvData.experience.map((exp: any) => `
            <div class="job">
              <div class="job-title">${exp.position || ''}</div>
              <div class="job-company">${exp.company || ''}</div>
              <div class="job-duration">${exp.startDate || ''} - ${exp.endDate || 'Present'}</div>
              ${exp.location ? `<div style="color: #6b7280; font-size: 0.9em;">${exp.location}</div>` : ''}
              ${exp.description ? `<div class="job-description">${exp.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${cvData.education && cvData.education.length > 0 ? `
        <div class="section">
          <h2>Education</h2>
          ${cvData.education.map((edu: any) => `
            <div class="job">
              <div class="job-title">${edu.degree || ''}</div>
              <div class="job-company">${edu.institution || ''}</div>
              <div class="job-duration">${edu.startDate || ''} - ${edu.endDate || 'Present'}</div>
              ${edu.location ? `<div style="color: #6b7280; font-size: 0.9em;">${edu.location}</div>` : ''}
              ${edu.description ? `<div class="job-description">${edu.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${cvData.skills && cvData.skills.length > 0 ? `
        <div class="section">
          <h2>Skills</h2>
          <div class="skills">
            ${cvData.skills.map((skill: any) => `<span class="skill">${skill.name || skill}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${cvData.projects && cvData.projects.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Projects</h2>
          ${cvData.projects.map((project: any) => {
            // Robustly handle technologies whether it's an array or a comma-separated string
            const technologies = Array.isArray(project.technologies)
              ? project.technologies
              : (typeof project.technologies === 'string' ? project.technologies.split(/[,;]/).map((t: string) => t.trim()) : []);

            return `
              <div class="project-item">
                <div class="project-header">
                  <div class="project-title">${project.name || ''}</div>
                  ${project.date ? `<div class="project-date">${project.date}</div>` : ''}
                </div>
                <p class="project-description">${sanitizeInput(project.description)}</p>
                <div class="technologies">
                  ${technologies.map((tech: string) => `<span class="tech-tag">${sanitizeInput(tech)}</span>`).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

export { router as pdfRoutes };

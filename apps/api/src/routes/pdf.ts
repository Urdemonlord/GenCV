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

function generateHTML(cvData: any, template: string = 'modern'): string {
  // Template-specific styles and HTML generation
  switch (template) {
    case 'classic':
      return generateClassicHTML(cvData);
    case 'creative':
      return generateCreativeHTML(cvData);
    case 'modern':
    default:
      return generateModernHTML(cvData);
  }
}

function generateModernHTML(cvData: any): string {
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
          color: #1f2937; 
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .cv-container {
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: white;
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header h1 {
          font-size: 2.25rem;
          font-weight: bold;
          margin: 0 0 4px 0;
        }
        .header .subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          margin: 0;
        }
        .contact-info {
          text-align: right;
          font-size: 0.875rem;
        }
        .contact-info div {
          margin: 4px 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        .content {
          padding: 32px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section h2 {
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .experience-item, .education-item, .project-item {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .experience-item:last-child, .education-item:last-child, .project-item:last-child {
          border-bottom: none;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .item-title {
          font-weight: 600;
          color: #1f2937;
          font-size: 1.125rem;
        }
        .item-company {
          color: #4b5563;
          font-weight: 500;
          margin-top: 2px;
        }
        .item-duration {
          color: #6b7280;
          font-size: 0.875rem;
          white-space: nowrap;
        }
        .item-description {
          color: #374151;
          line-height: 1.6;
          margin-top: 12px;
        }
        .summary {
          background: #f8fafc;
          border-left: 4px solid #2563eb;
          padding: 20px;
          margin: 0;
          border-radius: 0 6px 6px 0;
          color: #374151;
          line-height: 1.6;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
        }
        .skill-item {
          background: #e5e7eb;
          color: #374151;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .tech-tag {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        @media print {
          body { margin: 0; padding: 10mm; }
          .cv-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <header class="header">
          <div>
            <h1>${cvData.personalInfo?.fullName || 'Your Name'}</h1>
            <p class="subtitle">Professional</p>
          </div>
          <div class="contact-info">
            ${cvData.personalInfo?.email ? `<div>📧 ${cvData.personalInfo.email}</div>` : ''}
            ${cvData.personalInfo?.phone ? `<div>📞 ${cvData.personalInfo.phone}</div>` : ''}
            ${cvData.personalInfo?.location ? `<div>📍 ${cvData.personalInfo.location}</div>` : ''}
            ${cvData.personalInfo?.linkedIn ? `<div>💼 ${cvData.personalInfo.linkedIn}</div>` : ''}
            ${cvData.personalInfo?.website ? `<div>🌐 ${cvData.personalInfo.website}</div>` : ''}
          </div>
        </header>

        <div class="content">
          ${cvData.professionalSummary ? `
            <div class="section">
              <h2>Professional Summary</h2>
              <div class="summary">${cvData.professionalSummary}</div>
            </div>
          ` : ''}

          ${cvData.experience && cvData.experience.length > 0 ? `
            <div class="section">
              <h2>Work Experience</h2>
              ${cvData.experience.map((exp: any) => `
                <div class="experience-item">
                  <div class="item-header">
                    <div>
                      <div class="item-title">${exp.position || ''}</div>
                      <div class="item-company">${exp.company || ''}</div>
                    </div>
                    <div class="item-duration">${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}</div>
                  </div>
                  ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${cvData.education && cvData.education.length > 0 ? `
            <div class="section">
              <h2>Education</h2>
              ${cvData.education.map((edu: any) => `
                <div class="education-item">
                  <div class="item-header">
                    <div>
                      <div class="item-title">${edu.degree || ''} in ${edu.field || ''}</div>
                      <div class="item-company">${edu.institution || ''}</div>
                    </div>
                    <div class="item-duration">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${cvData.skills && cvData.skills.length > 0 ? `
            <div class="section">
              <h2>Skills</h2>
              <div class="skills-container">
                ${cvData.skills.map((skill: any) => `
                  <span class="skill-item">${skill.name || skill} ${skill.level ? `(${skill.level})` : ''}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${cvData.projects && cvData.projects.length > 0 ? `
            <div class="section">
              <h2>Projects</h2>
              ${cvData.projects.map((project: any) => {
                const technologies = Array.isArray(project.technologies)
                  ? project.technologies
                  : (typeof project.technologies === 'string' ? project.technologies.split(/[,;]/).map((t: string) => t.trim()) : []);

                return `
                  <div class="project-item">
                    <div class="item-header">
                      <div class="item-title">${project.name || ''}</div>
                      ${project.date ? `<div class="item-duration">${project.date}</div>` : ''}
                    </div>
                    ${project.description ? `<div class="item-description">${sanitizeInput(project.description)}</div>` : ''}
                    ${technologies.length > 0 ? `
                      <div class="tech-tags">
                        ${technologies.map((tech: string) => `<span class="tech-tag">${sanitizeInput(tech)}</span>`).join('')}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateClassicHTML(cvData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CV - ${cvData.personalInfo?.fullName || 'Resume'}</title>
      <style>
        body { 
          font-family: 'Times New Roman', serif; 
          margin: 0; 
          padding: 20px; 
          color: #111827; 
          background: white;
          line-height: 1.6;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .cv-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          border-bottom: 3px solid #111827;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .header h1 {
          font-size: 2.5rem;
          font-weight: bold;
          color: #111827;
          margin: 0 0 8px 0;
        }
        .contact-info {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 0.875rem;
          color: #374151;
        }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section h2 {
          font-size: 1.25rem;
          font-weight: bold;
          color: #111827;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 4px;
        }
        .experience-item, .education-item, .project-item {
          margin-bottom: 20px;
          padding-left: 16px;
          border-left: 1px solid #d1d5db;
        }
        .item-header {
          margin-bottom: 8px;
        }
        .item-title {
          font-weight: bold;
          font-size: 1.1rem;
          color: #111827;
        }
        .item-company {
          color: #374151;
          font-style: italic;
          margin-top: 2px;
        }
        .item-duration {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 4px;
        }
        .item-description {
          color: #374151;
          margin-top: 8px;
        }
        .summary {
          font-style: italic;
          color: #374151;
          background: #f9fafb;
          padding: 16px;
          border-left: 4px solid #6b7280;
          margin: 0;
        }
        .skills-container {
          margin-top: 8px;
        }
        .skill-category {
          margin-bottom: 12px;
        }
        .skill-category-title {
          font-weight: bold;
          color: #111827;
          margin-bottom: 4px;
        }
        .skill-items {
          color: #374151;
        }
        @media print {
          body { padding: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <header class="header">
          <h1>${cvData.personalInfo?.fullName || 'Your Name'}</h1>
          <div class="contact-info">
            ${cvData.personalInfo?.email ? `<div class="contact-item">📧 ${cvData.personalInfo.email}</div>` : ''}
            ${cvData.personalInfo?.phone ? `<div class="contact-item">📞 ${cvData.personalInfo.phone}</div>` : ''}
            ${cvData.personalInfo?.location ? `<div class="contact-item">📍 ${cvData.personalInfo.location}</div>` : ''}
            ${cvData.personalInfo?.linkedIn ? `<div class="contact-item">💼 ${cvData.personalInfo.linkedIn}</div>` : ''}
            ${cvData.personalInfo?.website ? `<div class="contact-item">🌐 ${cvData.personalInfo.website}</div>` : ''}
          </div>
        </header>

        ${cvData.professionalSummary ? `
          <div class="section">
            <h2>Professional Summary</h2>
            <div class="summary">${cvData.professionalSummary}</div>
          </div>
        ` : ''}

        ${cvData.experience && cvData.experience.length > 0 ? `
          <div class="section">
            <h2>Work Experience</h2>
            ${cvData.experience.map((exp: any) => `
              <div class="experience-item">
                <div class="item-header">
                  <div class="item-title">${exp.position || ''}</div>
                  <div class="item-company">${exp.company || ''}</div>
                  <div class="item-duration">${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}</div>
                </div>
                ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${cvData.education && cvData.education.length > 0 ? `
          <div class="section">
            <h2>Education</h2>
            ${cvData.education.map((edu: any) => `
              <div class="education-item">
                <div class="item-header">
                  <div class="item-title">${edu.degree || ''} in ${edu.field || ''}</div>
                  <div class="item-company">${edu.institution || ''}</div>
                  <div class="item-duration">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${cvData.skills && cvData.skills.length > 0 ? `
          <div class="section">
            <h2>Skills</h2>
            <div class="skills-container">
              ${['Technical', 'Soft', 'Language'].map(category => {
                const categorySkills = cvData.skills.filter((skill: any) => skill.category === category);
                if (categorySkills.length === 0) return '';
                return `
                  <div class="skill-category">
                    <div class="skill-category-title">${category}:</div>
                    <div class="skill-items">${categorySkills.map((skill: any) => `${skill.name || skill}${skill.level ? ` (${skill.level})` : ''}`).join(', ')}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        ${cvData.projects && cvData.projects.length > 0 ? `
          <div class="section">
            <h2>Projects</h2>
            ${cvData.projects.map((project: any) => {
              const technologies = Array.isArray(project.technologies)
                ? project.technologies
                : (typeof project.technologies === 'string' ? project.technologies.split(/[,;]/).map((t: string) => t.trim()) : []);

              return `
                <div class="project-item">
                  <div class="item-header">
                    <div class="item-title">${project.name || ''}</div>
                    ${project.date ? `<div class="item-duration">${project.date}</div>` : ''}
                  </div>
                  ${project.description ? `<div class="item-description">${sanitizeInput(project.description)}</div>` : ''}
                  ${technologies.length > 0 ? `<div class="item-description"><strong>Technologies:</strong> ${technologies.map((tech: string) => sanitizeInput(tech)).join(', ')}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

function generateCreativeHTML(cvData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CV - ${cvData.personalInfo?.fullName || 'Resume'}</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          padding: 20px; 
          color: #2d3748; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .cv-container {
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }
        .cv-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #f093fb 0%, #f5576c 25%, #4facfe 50%, #00f2fe 75%, #43e97b 100%);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
          position: relative;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-top: 20px solid #764ba2;
        }
        .header h1 {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 0 0 8px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header .subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 16px;
        }
        .contact-info {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 0.875rem;
        }
        .contact-item {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .content {
          padding: 40px;
          padding-top: 30px;
        }
        .section {
          margin-bottom: 40px;
        }
        .section h2 {
          color: #667eea;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 20px 0;
          position: relative;
          padding-bottom: 8px;
        }
        .section h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 50px;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
        }
        .experience-item, .education-item, .project-item {
          background: #f7fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border-left: 4px solid #667eea;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .item-title {
          font-weight: 600;
          color: #2d3748;
          font-size: 1.125rem;
        }
        .item-company {
          color: #4a5568;
          font-weight: 500;
          margin-top: 4px;
        }
        .item-duration {
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }
        .item-description {
          color: #4a5568;
          line-height: 1.6;
        }
        .summary {
          background: linear-gradient(135deg, #667eea10, #764ba210);
          border-radius: 12px;
          padding: 24px;
          color: #2d3748;
          line-height: 1.6;
          border-left: 4px solid #667eea;
          font-style: italic;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
        }
        .skill-item {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .tech-tag {
          background: #e2e8f0;
          color: #2d3748;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid #cbd5e0;
        }
        @media print {
          body { 
            background: white;
            padding: 10mm; 
          }
          .cv-container { 
            box-shadow: none; 
          }
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <header class="header">
          <h1>${cvData.personalInfo?.fullName || 'Your Name'}</h1>
          <p class="subtitle">Creative Professional</p>
          <div class="contact-info">
            ${cvData.personalInfo?.email ? `<div class="contact-item">📧 ${cvData.personalInfo.email}</div>` : ''}
            ${cvData.personalInfo?.phone ? `<div class="contact-item">📞 ${cvData.personalInfo.phone}</div>` : ''}
            ${cvData.personalInfo?.location ? `<div class="contact-item">📍 ${cvData.personalInfo.location}</div>` : ''}
            ${cvData.personalInfo?.linkedIn ? `<div class="contact-item">💼 ${cvData.personalInfo.linkedIn}</div>` : ''}
            ${cvData.personalInfo?.website ? `<div class="contact-item">🌐 ${cvData.personalInfo.website}</div>` : ''}
          </div>
        </header>

        <div class="content">
          ${cvData.professionalSummary ? `
            <div class="section">
              <h2>Professional Summary</h2>
              <div class="summary">${cvData.professionalSummary}</div>
            </div>
          ` : ''}

          ${cvData.experience && cvData.experience.length > 0 ? `
            <div class="section">
              <h2>Work Experience</h2>
              ${cvData.experience.map((exp: any) => `
                <div class="experience-item">
                  <div class="item-header">
                    <div>
                      <div class="item-title">${exp.position || ''}</div>
                      <div class="item-company">${exp.company || ''}</div>
                    </div>
                    <div class="item-duration">${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}</div>
                  </div>
                  ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${cvData.education && cvData.education.length > 0 ? `
            <div class="section">
              <h2>Education</h2>
              ${cvData.education.map((edu: any) => `
                <div class="education-item">
                  <div class="item-header">
                    <div>
                      <div class="item-title">${edu.degree || ''} in ${edu.field || ''}</div>
                      <div class="item-company">${edu.institution || ''}</div>
                    </div>
                    <div class="item-duration">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${cvData.skills && cvData.skills.length > 0 ? `
            <div class="section">
              <h2>Skills</h2>
              <div class="skills-container">
                ${cvData.skills.map((skill: any) => `
                  <span class="skill-item">${skill.name || skill} ${skill.level ? `(${skill.level})` : ''}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${cvData.projects && cvData.projects.length > 0 ? `
            <div class="section">
              <h2>Projects</h2>
              ${cvData.projects.map((project: any) => {
                const technologies = Array.isArray(project.technologies)
                  ? project.technologies
                  : (typeof project.technologies === 'string' ? project.technologies.split(/[,;]/).map((t: string) => t.trim()) : []);

                return `
                  <div class="project-item">
                    <div class="item-header">
                      <div class="item-title">${project.name || ''}</div>
                      ${project.date ? `<div class="item-duration">${project.date}</div>` : ''}
                    </div>
                    ${project.description ? `<div class="item-description">${sanitizeInput(project.description)}</div>` : ''}
                    ${technologies.length > 0 ? `
                      <div class="tech-tags">
                        ${technologies.map((tech: string) => `<span class="tech-tag">${sanitizeInput(tech)}</span>`).join('')}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

export { router as pdfRoutes };

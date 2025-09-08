import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { CVData } from '@cv-generator/types';
import { getPuppeteerConfig, initChromeFonts } from '../../lib/puppeteer-config';
import { generateHTML } from '../../lib/html-generator';
import { generatePDFWithFallback } from '../../lib/pdf-fallback';

// Konfigurasi khusus untuk endpoint PDF
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic'; // Memastikan bahwa route ini tidak di-cache

// Main handler for PDF generation
export async function POST(request: NextRequest) {
  console.log('PDF generation request received:', request.url);
  
  try {
    // Parse the request body
    const { cvData, template } = await request.json();
    console.log('Processing PDF request with template:', template);
    
    // Generate PDF - try with Puppeteer first, fall back to simple text if it fails
    let pdfBuffer: Buffer;
    let isTextFallback = false;
    
    try {
      // Try primary method first
      console.log('Attempting PDF generation with Puppeteer...');
      pdfBuffer = await generatePDFWithPuppeteer(cvData, template || 'modern');
      console.log('Generated PDF using Puppeteer, size:', pdfBuffer.length);
    } 
    catch (puppeteerError) {
      // Log the error but continue with fallback
      console.error('Puppeteer PDF generation failed:', puppeteerError);
      console.log('Trying fallback PDF generation...');
      
      // Use fallback method
      pdfBuffer = await generatePDFWithFallback(cvData, template || 'modern');
      console.log('Generated PDF using fallback method, size:', pdfBuffer.length);
      isTextFallback = true;
    }
    
    // Return the PDF response
    const fullName = cvData.personalInfo?.fullName || 'cv';
    const fileName = `${fullName.replace(/[^a-zA-Z0-9.-]/g, '_')}.${isTextFallback ? 'txt' : 'pdf'}`;
    
    // Convert the buffer to a ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      }
    });
    
    // Set appropriate content type based on whether we're returning a text fallback or PDF
    const contentType = isTextFallback ? 'text/plain' : 'application/pdf';
    
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } 
  catch (error) {
    console.error('PDF Generation Error:', error);
    
    // Get more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack
    });
    
    return NextResponse.json(
      { 
        error: 'PDF generation failed', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined 
      },
      { status: 500 }
    );
  }
}

// Helper function to generate PDF using Puppeteer
async function generatePDFWithPuppeteer(cvData: CVData, template: string): Promise<Buffer> {
  // Generate HTML content
  const html = generateHTML(cvData, template);
  
  try {
    // Setup Chromium
    console.log('Initializing Puppeteer...');
    await initChromeFonts();
    
    // Get Puppeteer configuration with working Chrome path
    const puppeteerConfig = await getPuppeteerConfig();
    console.log('Using Chromium executable path:', puppeteerConfig.executablePath);
    
    // Launch browser
    const browser = await puppeteer.launch(puppeteerConfig);
    
    try {
      // Create page and set content
      const page = await browser.newPage();
      console.log('Setting page content...');
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      console.log('Generating PDF...');
      const pdfData = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        timeout: 30000, // 30 second timeout for PDF generation
      });
      
      // Convert Uint8Array to Buffer
      const pdfBuffer = Buffer.from(pdfData);
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      return pdfBuffer;
    } 
    finally {
      // Always close the browser to prevent memory leaks
      await browser.close();
      console.log('Browser closed');
    }
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error; // Let the caller handle the fallback
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { CVData } from '@cv-generator/types';
import { generatePDF } from '../../actions/pdf-generator';

// Konfigurasi khusus untuk endpoint PDF
export const runtime = 'nodejs'; // Memastikan kompatibilitas dengan Puppeteer
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic'; // Memastikan bahwa route ini tidak di-cache

// Main handler for PDF generation
export async function POST(request: NextRequest) {
  console.log('PDF generation request received:', request.url);

  try {
    // Parse the request body with explicit error handling
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { cvData, template } = body as { cvData?: CVData; template?: string };
    if (!cvData) {
      return NextResponse.json(
        { error: 'Missing cvData' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.log('Processing PDF request with template:', template);

    // Generate PDF using server action
    const { buffer, filename } = await generatePDF(cvData, template || 'modern');
    console.log('Generated PDF, size:', buffer.length);

    // Get PDF signature for debugging
    const signature = buffer.slice(0, 5).toString('utf-8');
    console.log('File signature:', signature);

    // Convert the buffer to a ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Debug headers
        'X-PDF-Size': buffer.length.toString(),
        'X-PDF-Signature': signature
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);

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
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // 60 seconds timeout
export const runtime = 'nodejs'; // Gunakan runtime nodejs untuk memastikan SDK Google berfungsi dengan benar

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { text, enhancementType } = data;
    
    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Prompt based on enhancement type
    let prompt = '';
    switch (enhancementType) {
      case 'professional':
        prompt = `Make this text more professional and suitable for a CV: "${text}"`;
        break;
      case 'concise':
        prompt = `Make this text more concise while maintaining key information: "${text}"`;
        break;
      case 'achievements':
        prompt = `Rewrite this text to highlight achievements and measurable results: "${text}"`;
        break;
      case 'keywords':
        prompt = `Enhance this text with relevant industry keywords for better ATS matching: "${text}"`;
        break;
      default:
        prompt = `Enhance this text for a CV: "${text}"`;
    }
    
    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedText = response.text();
    
    return NextResponse.json({ enhancedText });
  } catch (error) {
    console.error('AI enhancement failed:', error);
    return NextResponse.json(
      { error: 'AI enhancement failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  console.log('AI API request received:', request.method, request.url);
  
  try {
    const data = await request.json();
    console.log('Request body received:', data);
    
    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured properly' },
        { status: 500 }
      );
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Create prompt based on request type
    let prompt = '';
    let responseData = '';
    
    switch (data.type) {
      case 'summary':
        // For professional summary enhancement
        prompt = `Create a compelling professional summary for a CV based on this information: "${data.text}".
        Guidelines:
        - Keep it concise (3-4 sentences max)
        - Highlight key skills and experience level
        - Include career objectives or passion
        - Use active voice and first-person perspective
        - Avoid clichés and focus on unique value proposition
        - Ensure the tone is confident but not arrogant`;
        break;
        
      case 'experience':
        // For work experience enhancement
        prompt = `Enhance this job description for a CV, focusing on achievements and impact:
        Role: ${data.role || 'Professional'}
        Company: ${data.company || 'Company'}
        Description to enhance: "${data.text}"
        
        Guidelines:
        - Start with strong action verbs
        - Quantify achievements where possible (%, numbers, metrics)
        - Focus on results and impact, not just responsibilities
        - Highlight relevant skills for ${data.role || 'this position'}
        - Keep entries concise and impactful
        - Include keywords relevant to the industry`;
        break;
        
      case 'skills':
        // For suggesting skills based on role and experience level
        prompt = `Suggest 8-10 relevant professional skills for a ${data.experienceLevel || 'mid-level'} ${data.role || 'Software Developer'}.
        
        Include:
        - Technical skills specific to the role
        - Relevant soft skills (2-3)
        - Industry-specific knowledge
        - Current in-demand technologies or methodologies
        
        Format as a comma-separated list only, without explanations or numbering.`;
        break;
        
      case 'project':
        // For generating project descriptions
        prompt = `Write a concise, professional project description for a CV with the following details:
        Project Name: ${data.projectName}
        Technologies Used: ${Array.isArray(data.technologies) ? data.technologies.join(', ') : data.technologies}
        Project Type: ${data.projectType || 'Software Project'}
        
        Guidelines:
        - 2-3 impactful sentences only
        - Start with the project purpose/problem solved
        - Mention specific technologies and your role
        - Include measurable outcomes or impact
        - Focus on unique challenges overcome
        - Use first-person perspective and active voice`;
        break;
        
      default:
        // Default enhancement
        prompt = `Enhance this text to be more impactful for a CV: "${data.text}"
        
        Guidelines:
        - Use strong action verbs and professional language
        - Be concise but detailed
        - Quantify achievements where possible
        - Focus on results and impact
        - Ensure content is relevant to hiring managers
        - Keep the tone confident and professional`;
    }
    
    console.log('Sending prompt to Gemini:', { type: data.type, prompt: prompt.substring(0, 100) + '...' });
    
    // Generate response using the new API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    responseData = response.text || ''; // Handle undefined case
    
    console.log('Received response from Gemini:', { responseLength: responseData.length });

    return NextResponse.json({ 
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('AI enhancement failed:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'AI enhancement failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

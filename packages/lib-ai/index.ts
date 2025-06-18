import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIRewriteRequest, AIResponse } from '@cv-generator/types';

export class GeminiAI {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async rewriteExperience(request: AIRewriteRequest): Promise<AIResponse> {
    try {
      const prompt = `
        Rewrite the following job experience description to make it more professional and impactful for a CV/resume.
        
        Role: ${request.role}
        Company: ${request.company}
        Original Description: ${request.text}
        
        Please:
        1. Use strong action verbs
        2. Quantify achievements where possible
        3. Highlight relevant skills and technologies
        4. Keep it concise but impactful
        5. Use bullet points if appropriate
        6. Focus on achievements rather than just responsibilities
        
        Return only the improved description, no additional text or formatting.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: text.trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async generateSummary(experienceLevel: string, role: string, skills: string[]): Promise<AIResponse> {
    try {
      const prompt = `
        Generate a professional summary for a CV/resume with the following details:
        
        Experience Level: ${experienceLevel}
        Target Role: ${role}
        Key Skills: ${skills.join(', ')}
        
        Please create a 2-3 sentence professional summary that:
        1. Highlights relevant experience level
        2. Mentions key skills
        3. Shows enthusiasm for the target role
        4. Is professional and impactful
        5. Avoids clichés and generic phrases
        
        Return only the summary, no additional text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: text.trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async suggestSkills(role: string, experienceLevel: string): Promise<AIResponse> {
    try {
      const prompt = `
        Suggest 8-12 relevant skills for someone applying for a ${role} position with ${experienceLevel} experience level.
        
        Please provide:
        1. A mix of technical and soft skills
        2. Skills that are currently in demand for this role
        3. Skills appropriate for the experience level
        
        Return the skills as a simple comma-separated list, no additional text or formatting.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: text.trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export * from '@cv-generator/types';
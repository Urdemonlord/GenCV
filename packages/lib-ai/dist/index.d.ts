import { AIRewriteRequest, AIResponse } from '@cv-generator/types';
export * from '@cv-generator/types';

declare class GeminiAI {
    private apiKey;
    constructor(apiKey: string);
    private callGeminiAPI;
    rewriteExperience(request: AIRewriteRequest): Promise<AIResponse>;
    generateSummary(experienceLevel: string, role: string, skills: string[]): Promise<AIResponse>;
    suggestSkills(role: string, experienceLevel: string): Promise<AIResponse>;
    generateProjectDescription(projectName: string, technologies: string[], projectType?: string): Promise<AIResponse>;
}
declare const getAI: () => GeminiAI;

export { GeminiAI, getAI };

// index.ts
export * from "@cv-generator/types";
var GeminiAI = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async callGeminiAPI(prompt) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
  async rewriteExperience(request) {
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
      const result = await this.callGeminiAPI(prompt);
      return {
        success: true,
        data: result.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
  async generateSummary(experienceLevel, role, skills) {
    try {
      const prompt = `
        Create a professional summary for a CV/resume with the following details:
        
        Experience Level: ${experienceLevel}
        Target Role: ${role}
        Key Skills: ${skills.join(", ")}
        
        Please create a 2-3 sentence professional summary that:
        1. Highlights relevant experience level
        2. Mentions key skills
        3. Shows enthusiasm for the target role
        4. Is professional and impactful
        5. Avoids clich\xE9s and generic phrases
        
        Return only the summary, no additional text.
      `;
      const result = await this.callGeminiAPI(prompt);
      return {
        success: true,
        data: result.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
  async suggestSkills(role, experienceLevel) {
    try {
      const prompt = `
        Suggest 8-12 relevant skills for someone applying for a ${role} position with ${experienceLevel} experience level.
        
        Please provide:
        1. A mix of technical and soft skills
        2. Skills that are currently in demand for this role
        3. Skills appropriate for the experience level
        
        Return the skills as a simple comma-separated list, no additional text or formatting.
      `;
      const result = await this.callGeminiAPI(prompt);
      return {
        success: true,
        data: result.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
  async generateProjectDescription(projectName, technologies, projectType) {
    try {
      const prompt = `
        Generate a professional project description for a CV/resume with the following details:
        
        Project Name: ${projectName}
        Technologies Used: ${technologies.join(", ")}
        Project Type: ${projectType || "Web/Software Project"}
        
        Please create a 2-3 sentence project description that:
        1. Explains what the project does and its purpose
        2. Highlights the key technologies and features
        3. Mentions the impact or results (use realistic examples)
        4. Sounds professional and impressive
        5. Focuses on technical achievements and problem-solving
        
        Return only the description, no additional text or formatting.
      `;
      const result = await this.callGeminiAPI(prompt);
      return {
        success: true,
        data: result.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
};
var getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GeminiAI(apiKey);
};
export {
  GeminiAI,
  getAI
};

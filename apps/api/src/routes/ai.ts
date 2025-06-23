import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { GeminiAI } from '@cv-generator/lib-ai';
import { sanitizeInput } from '@cv-generator/utils/shared';

const router = Router();

// AI-specific rate limiting (more restrictive)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 AI requests per windowMs
  message: 'Too many AI requests, please try again later.',
});

// Initialize Gemini AI
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GeminiAI(apiKey);
};

// Validation middleware
const validateRewriteRequest = [
  body('text').isString().isLength({ min: 10, max: 2000 }).withMessage('Text must be 10-2000 characters'),
  body('role').isString().isLength({ min: 2, max: 100 }).withMessage('Role must be 2-100 characters'),
  body('company').isString().isLength({ min: 2, max: 100 }).withMessage('Company must be 2-100 characters'),
];

const validateSummaryRequest = [
  body('experienceLevel').isIn(['fresh', 'professional']).withMessage('Invalid experience level'),
  body('role').isString().isLength({ min: 2, max: 100 }).withMessage('Role must be 2-100 characters'),
  body('skills').isArray({ min: 1, max: 20 }).withMessage('Skills must be an array of 1-20 items'),
];

const validateSkillsRequest = [
  body('role').isString().isLength({ min: 2, max: 100 }).withMessage('Role must be 2-100 characters'),
  body('experienceLevel').isIn(['fresh', 'professional']).withMessage('Invalid experience level'),
];

const validateProjectDescriptionRequest = [
  body('projectName').isString().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
  body('technologies').isArray({ min: 1, max: 10 }).withMessage('Technologies must be an array of 1-10 items'),
  body('projectType').optional().isString().isLength({ max: 50 }).withMessage('Project type must be max 50 characters'),
];

// Routes
router.post('/rewrite-experience', aiLimiter, validateRewriteRequest, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { text, role, company } = req.body;
    
    // Sanitize inputs
    const sanitizedText = sanitizeInput(text);
    const sanitizedRole = sanitizeInput(role);
    const sanitizedCompany = sanitizeInput(company);

    const ai = getAI();
    const result = await ai.rewriteExperience({
      text: sanitizedText,
      role: sanitizedRole,
      company: sanitizedCompany,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in rewrite-experience:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error occurred while processing your request' 
    });
  }
});

router.post('/summarize-profile', aiLimiter, validateSummaryRequest, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { experienceLevel, role, skills } = req.body;
    
    // Sanitize inputs
    const sanitizedRole = sanitizeInput(role);
    const sanitizedSkills = skills.map((skill: string) => sanitizeInput(skill));

    const ai = getAI();
    const result = await ai.generateSummary(experienceLevel, sanitizedRole, sanitizedSkills);

    res.json(result);
  } catch (error) {
    console.error('Error in summarize-profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error occurred while processing your request' 
    });
  }
});

router.post('/suggest-skills', aiLimiter, validateSkillsRequest, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { role, experienceLevel } = req.body;
    
    // Sanitize inputs
    const sanitizedRole = sanitizeInput(role);

    const ai = getAI();
    const result = await ai.suggestSkills(sanitizedRole, experienceLevel);

    res.json(result);
  } catch (error) {
    console.error('Error in suggest-skills:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error occurred while processing your request' 
    });
  }
});

router.post('/generate-project-description', aiLimiter, validateProjectDescriptionRequest, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { projectName, technologies, projectType } = req.body;
    
    // Sanitize inputs
    const sanitizedProjectName = sanitizeInput(projectName);
    const sanitizedTechnologies = technologies.map((tech: string) => sanitizeInput(tech));
    const sanitizedProjectType = projectType ? sanitizeInput(projectType) : undefined;

    const ai = getAI();
    const result = await ai.generateProjectDescription(sanitizedProjectName, sanitizedTechnologies, sanitizedProjectType);

    res.json(result);
  } catch (error) {
    console.error('Error in generate-project-description:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error occurred while processing your request' 
    });
  }
});

export { router as aiRoutes };
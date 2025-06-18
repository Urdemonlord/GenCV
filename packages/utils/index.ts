import { CVData, CVScore } from '@cv-generator/types';

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatDate = (date: string): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const calculateCVScore = (cvData: CVData): CVScore => {
  const scores = {
    personalInfo: 0,
    summary: 0,
    experience: 0,
    education: 0,
    skills: 0,
  };

  const suggestions: string[] = [];

  // Personal Info Score (20%)
  const personalInfo = cvData.personalInfo;
  let personalScore = 0;
  if (personalInfo.fullName) personalScore += 25;
  if (personalInfo.email && validateEmail(personalInfo.email)) personalScore += 25;
  if (personalInfo.phone && validatePhone(personalInfo.phone)) personalScore += 25;
  if (personalInfo.location) personalScore += 25;
  scores.personalInfo = personalScore;

  if (personalScore < 100) {
    suggestions.push('Complete all personal information fields');
  }

  // Summary Score (15%)
  const summary = cvData.professionalSummary;
  if (summary && summary.length >= 50) {
    scores.summary = summary.length >= 100 ? 100 : (summary.length / 100) * 100;
  } else {
    suggestions.push('Add a professional summary of at least 50 characters');
  }

  // Experience Score (35%)
  const experience = cvData.experience;
  if (experience.length > 0) {
    const avgDescLength = experience.reduce((acc, exp) => acc + exp.description.length, 0) / experience.length;
    scores.experience = Math.min(100, (experience.length * 30) + (avgDescLength / 2));
  } else {
    suggestions.push('Add work experience or relevant projects');
  }

  // Education Score (15%)
  const education = cvData.education;
  if (education.length > 0) {
    scores.education = Math.min(100, education.length * 50);
  } else {
    suggestions.push('Add your educational background');
  }

  // Skills Score (15%)
  const skills = cvData.skills;
  if (skills.length > 0) {
    scores.skills = Math.min(100, skills.length * 10);
  } else {
    suggestions.push('Add relevant skills to showcase your expertise');
  }

  const overall = Math.round(
    (scores.personalInfo * 0.2) +
    (scores.summary * 0.15) +
    (scores.experience * 0.35) +
    (scores.education * 0.15) +
    (scores.skills * 0.15)
  );

  return {
    overall,
    sections: scores,
    suggestions,
  };
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<[^>]*>/g, '')
              .trim();
};

export const exportToJSON = (cvData: CVData): string => {
  return JSON.stringify(cvData, null, 2);
};

export const importFromJSON = (jsonString: string): CVData | null => {
  try {
    const data = JSON.parse(jsonString);
    // Basic validation
    if (data && typeof data === 'object' && data.personalInfo) {
      return data as CVData;
    }
    return null;
  } catch {
    return null;
  }
};

export const saveToLocalStorage = (key: string, data: CVData): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key: string): CVData | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};
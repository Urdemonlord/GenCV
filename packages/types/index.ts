export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  website?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: 'Technical' | 'Soft' | 'Language';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface CVData {
  personalInfo: PersonalInfo;
  professionalSummary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  experienceLevel: 'fresh' | 'professional';
}

export interface AIRewriteRequest {
  text: string;
  role: string;
  company: string;
}

export interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface CVScore {
  overall: number;
  sections: {
    personalInfo: number;
    summary: number;
    experience: number;
    education: number;
    skills: number;
  };
  suggestions: string[];
}
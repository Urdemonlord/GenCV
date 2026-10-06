import type { CV } from './schema';

/**
 * Interim completeness score for the v2 model: which essentials are filled in, nothing more.
 * Replaced by the rule-based ATS analysis in milestone R4.
 */
export function calculateCompleteness(cv: CV) {
  const info = cv.personalInfo;
  const filled = (value: string) => value.trim() !== '';
  const ratio = (done: number, total: number) => Math.round((done / total) * 100);
  const suggestions: string[] = [];

  const contact = [info.fullName, info.email, info.phone, info.location].filter(filled).length;
  if (contact < 4) suggestions.push('Complete name, email, phone and location');

  const summary = filled(cv.professionalSummary) ? 100 : 0;
  if (!summary) suggestions.push('Add a short professional summary');

  const bullets = cv.experience.flatMap((exp) => exp.bullets).filter(filled).length;
  const experience = cv.experience.length === 0 ? 0 : Math.min(100, 40 + bullets * 15);
  if (cv.experience.length === 0) suggestions.push('Add work experience, internships or projects');
  else if (bullets < 3) suggestions.push('Describe your experience with at least 3 achievement bullets');

  const education = cv.education.length > 0 ? 100 : 0;
  if (!education) suggestions.push('Add your education');

  const skills = Math.min(100, cv.skills.length * 15);
  if (cv.skills.length < 5) suggestions.push('List at least 5 relevant skills');

  const sections = {
    personalInfo: ratio(contact, 4),
    summary,
    experience,
    education,
    skills,
  };
  const overall = Math.round(
    sections.personalInfo * 0.2 + summary * 0.15 + experience * 0.35 + education * 0.15 + skills * 0.15
  );
  return { overall, sections, suggestions };
}

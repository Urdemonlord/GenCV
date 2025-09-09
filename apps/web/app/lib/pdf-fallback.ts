// Simple fallback for PDF generation when Puppeteer fails
import { CVData } from '@cv-generator/types';

// Use a simple text-based fallback as text, not PDF
export async function generatePDFWithFallback(cvData: CVData, template: string): Promise<Buffer> {
  try {
    console.log('Using fallback text generation (not PDF)...');
    
    // Since we're in a Next.js environment and can't use node modules directly in API routes,
    // we'll use a very simple approach to create a text fallback
    
    // Convert HTML to a simplified text format
    const { personalInfo, education, experience, skills, projects, professionalSummary } = cvData;
    
    // Create a simple PDF buffer with basic CV information
    const pdfText = `
CV - ${personalInfo?.fullName || 'Unnamed'}
============================================

PERSONAL INFORMATION
-------------------
Name: ${personalInfo?.fullName || ''}
Email: ${personalInfo?.email || ''}
Phone: ${personalInfo?.phone || ''}
Location: ${personalInfo?.location || ''}
${personalInfo?.linkedIn ? `LinkedIn: ${personalInfo.linkedIn}` : ''}
${personalInfo?.website ? `Website: ${personalInfo.website}` : ''}

${professionalSummary ? `PROFESSIONAL SUMMARY
-------------------
${professionalSummary}

` : ''}

${experience && experience.length > 0 ? `EXPERIENCE
----------
${experience.map(exp => `• ${exp.position || ''} at ${exp.company || ''}
  ${exp.startDate || ''} - ${exp.endDate || 'Present'}
  ${exp.description || ''}`).join('\n\n')}

` : ''}

${education && education.length > 0 ? `EDUCATION
---------
${education.map(edu => `• ${edu.degree || ''} in ${edu.field || ''}
  ${edu.institution || ''}
  ${edu.startDate || ''} - ${edu.endDate || 'Present'}`).join('\n\n')}

` : ''}

${skills && skills.length > 0 ? `SKILLS
------
${skills.map(skill => skill.name).join(', ')}

` : ''}

${projects && projects.length > 0 ? `PROJECTS
--------
${projects.map(project => `• ${project.name || ''}
  ${project.description || ''}`).join('\n\n')}

` : ''}

This is a text-based CV generated because PDF generation failed.
Please try again later or contact support if this problem persists.
`;

    // Convert text to buffer (this is explicitly text, not PDF)
    console.log('Created fallback text-based CV');
    return Buffer.from(pdfText, 'utf-8');
  } catch (error) {
    console.error('Fallback text generation failed:', error);
    // Return a minimal error message as text if everything else fails
    return Buffer.from('CV generation failed. Please try again later.', 'utf-8');
  }
}

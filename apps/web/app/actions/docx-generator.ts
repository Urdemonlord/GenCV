'use server';

import { CVData } from '@cv-generator/types';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';

export async function generateDOCX(cvData: CVData, _template: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const fullName = cvData.personalInfo?.fullName || 'cv';
  const safeFilename = fullName.replace(/[^a-zA-Z0-9.-]/g, '_');

  const paragraphs: Paragraph[] = [];

  paragraphs.push(new Paragraph({ text: `CV - ${fullName}`, heading: HeadingLevel.TITLE }));
  paragraphs.push(new Paragraph({ text: '' }));

  paragraphs.push(new Paragraph({ text: 'PERSONAL INFORMATION', heading: HeadingLevel.HEADING_2 }));
  const info = cvData.personalInfo || {};
  if (info.fullName) paragraphs.push(new Paragraph(info.fullName));
  if (info.email) paragraphs.push(new Paragraph(`Email: ${info.email}`));
  if (info.phone) paragraphs.push(new Paragraph(`Phone: ${info.phone}`));
  if (info.location) paragraphs.push(new Paragraph(`Location: ${info.location}`));
  paragraphs.push(new Paragraph({ text: '' }));

  if (cvData.professionalSummary) {
    paragraphs.push(new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_2 }));
    paragraphs.push(new Paragraph(cvData.professionalSummary));
    paragraphs.push(new Paragraph({ text: '' }));
  }

  if (cvData.experience && cvData.experience.length > 0) {
    paragraphs.push(new Paragraph({ text: 'EXPERIENCE', heading: HeadingLevel.HEADING_2 }));
    for (const exp of cvData.experience) {
      paragraphs.push(new Paragraph({ text: `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})`, bullet: { level: 0 } }));
      if (exp.description) paragraphs.push(new Paragraph({ text: exp.description, bullet: { level: 1 } }));
    }
    paragraphs.push(new Paragraph({ text: '' }));
  }

  if (cvData.education && cvData.education.length > 0) {
    paragraphs.push(new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2 }));
    for (const edu of cvData.education) {
      paragraphs.push(new Paragraph({ text: `${edu.degree} - ${edu.institution} (${edu.startDate} - ${edu.endDate})`, bullet: { level: 0 } }));
      if (edu.field) paragraphs.push(new Paragraph({ text: edu.field, bullet: { level: 1 } }));
    }
    paragraphs.push(new Paragraph({ text: '' }));
  }

  if (cvData.skills && cvData.skills.length > 0) {
    paragraphs.push(new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_2 }));
    paragraphs.push(new Paragraph(cvData.skills.join(', ')));
    paragraphs.push(new Paragraph({ text: '' }));
  }

  if (cvData.projects && cvData.projects.length > 0) {
    paragraphs.push(new Paragraph({ text: 'PROJECTS', heading: HeadingLevel.HEADING_2 }));
    for (const project of cvData.projects) {
      const name = project.name ? `${project.name}` : '';
      const desc = project.description ? ` - ${project.description}` : '';
      paragraphs.push(new Paragraph({ text: `${name}${desc}`, bullet: { level: 0 } }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return { buffer, filename: `${safeFilename}.docx` };
}

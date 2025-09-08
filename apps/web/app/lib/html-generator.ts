import { CVData } from '@cv-generator/types';

// Function to generate HTML based on template and CV data
export function generateHTML(cvData: CVData, template: string): string {
  // We'll use a simple approach here, but in a real application,
  // you might want to use a proper templating engine or React server components
  
  const { personalInfo, education, experience, skills, projects } = cvData;
  
  // Basic template structure
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${personalInfo?.fullName || 'CV'}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 21cm;
          margin: 0 auto;
          padding: 2cm;
        }
        .header {
          text-align: ${template === 'creative' ? 'center' : 'left'};
          margin-bottom: 1cm;
          ${template === 'modern' ? 'border-bottom: 2px solid #3498db;' : ''}
          ${template === 'creative' ? 'background-color: #f5f5f5; padding: 1cm;' : ''}
        }
        .section {
          margin-bottom: 1cm;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 0.5cm;
          ${template === 'modern' ? 'color: #3498db;' : ''}
          ${template === 'creative' ? 'text-transform: uppercase; letter-spacing: 2px;' : ''}
        }
        .item {
          margin-bottom: 0.5cm;
        }
        .item-title {
          font-weight: bold;
        }
        .item-subtitle {
          font-style: italic;
          color: #666;
        }
        .item-date {
          color: #999;
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
        }
        .skill-item {
          background-color: ${template === 'modern' ? '#e1f0fa' : '#f5f5f5'};
          padding: 5px 10px;
          margin-right: 10px;
          margin-bottom: 10px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${personalInfo?.fullName || ''}</h1>
          <p></p>
          <p>${personalInfo?.email || ''} | ${personalInfo?.phone || ''}</p>
          <p>${personalInfo?.location || ''}</p>
          ${personalInfo?.linkedIn ? `<p>LinkedIn: ${personalInfo.linkedIn}</p>` : ''}
          ${personalInfo?.website ? `<p>Website: ${personalInfo.website}</p>` : ''}
        </div>
        </div>

        ${cvData.professionalSummary ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <p>${cvData.professionalSummary}</p>
        </div>
        ` : ''}

        ${experience && experience.length > 0 ? `
        <div class="section">
          <div class="section-title">Experience</div>
          ${experience.map(exp => `
            <div class="item">
              <div class="item-title">${exp.position || ''}</div>
              <div class="item-subtitle">${exp.company || ''}</div>
              <div class="item-date">${exp.startDate ? formatDate(exp.startDate) : ''} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}</div>
              <p>${exp.description || ''}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${education && education.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${education.map(edu => `
            <div class="item">
              <div class="item-title">${edu.degree || ''}</div>
              <div class="item-subtitle">${edu.institution || ''}</div>
              <div class="item-date">${edu.startDate ? formatDate(edu.startDate) : ''} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}</div>
              <p>${edu.field || ''}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${skills && skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="skills-list">
            ${skills.map(skill => `<div class="skill-item">${skill.name || ''}</div>`).join('')}
          </div>
        </div>
        ` : ''}

        ${projects && projects.length > 0 ? `
        <div class="section">
          <div class="section-title">Projects</div>
          ${projects.map(project => `
            <div class="item">
              <div class="item-title">${project.name || ''}</div>
              <div class="item-date"></div>
              <p>${project.description || ''}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

// Helper function to format dates
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
}

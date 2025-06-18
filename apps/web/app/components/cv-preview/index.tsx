'use client';

import { useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { CVData } from '@cv-generator/types';
import { Button, Card, CardContent, Progress, Badge } from '@cv-generator/ui';
import { calculateCVScore, formatDate } from '@cv-generator/utils';

interface CVPreviewProps {
  cvData: CVData;
}

export function CVPreview({ cvData }: CVPreviewProps) {
  const [showScore, setShowScore] = useState(false);
  const cvScore = calculateCVScore(cvData);

  const handleDownload = () => {
    // In a real implementation, this would generate and download a PDF
    console.log('Download PDF functionality would be implemented here');
  };

  return (
    <div className="space-y-4">
      {/* CV Score Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">CV Completeness Score</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScore(!showScore)}
            >
              {showScore ? 'Hide Details' : 'View Details'}
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Score</span>
              <span className="font-medium">{cvScore.overall}%</span>
            </div>
            <Progress value={cvScore.overall} className="h-2" />
          </div>

          {showScore && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(cvScore.sections).map(([section, score]) => (
                  <div key={section} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="capitalize">{section.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{score}%</span>
                    </div>
                    <Progress value={score} className="h-1" />
                  </div>
                ))}
              </div>
              
              {cvScore.suggestions.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded text-xs">
                  <h4 className="font-medium mb-1">Suggestions:</h4>
                  <ul className="space-y-0.5">
                    {cvScore.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CV Preview */}
      <Card className="min-h-[600px]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </h3>
            <Button onClick={handleDownload} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* CV Content */}
          <div className="bg-white text-black p-8 rounded border min-h-[500px] space-y-6">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {cvData.personalInfo.fullName || 'Your Name'}
              </h1>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                {cvData.personalInfo.email && <div>{cvData.personalInfo.email}</div>}
                <div className="flex justify-center gap-4 flex-wrap">
                  {cvData.personalInfo.phone && <span>{cvData.personalInfo.phone}</span>}
                  {cvData.personalInfo.location && <span>{cvData.personalInfo.location}</span>}
                  {cvData.personalInfo.linkedIn && <span>{cvData.personalInfo.linkedIn}</span>}
                  {cvData.personalInfo.website && <span>{cvData.personalInfo.website}</span>}
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            {cvData.professionalSummary && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                  Professional Summary
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {cvData.professionalSummary}
                </p>
              </div>
            )}

            {/* Experience */}
            {cvData.experience.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {cvData.experience.map(exp => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{exp.position}</h3>
                          <p className="text-sm text-gray-600">{exp.company} {exp.location && `• ${exp.location}`}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cvData.education.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                  Education
                </h2>
                <div className="space-y-3">
                  {cvData.education.map(edu => (
                    <div key={edu.id} className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{edu.degree} in {edu.field}</h3>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {cvData.skills.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                  Skills
                </h2>
                <div className="space-y-2">
                  {['Technical', 'Soft', 'Language'].map(category => {
                    const categorySkills = cvData.skills.filter(skill => skill.category === category);
                    if (categorySkills.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-800 mb-1">{category}:</h4>
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map(skill => (
                            <span 
                              key={skill.id} 
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {skill.name} ({skill.level})
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Projects */}
            {cvData.projects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-3">
                  Projects
                </h2>
                <div className="space-y-4">
                  {cvData.projects.map(project => (
                    <div key={project.id} className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        {project.link && (
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Project
                          </a>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.map((tech, index) => (
                            <span 
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!cvData.personalInfo.fullName && (
              <div className="text-center text-gray-500 py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start filling out your information to see the preview</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
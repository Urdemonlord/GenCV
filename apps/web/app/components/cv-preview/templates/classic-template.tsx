'use client';

import { CVData } from '@cv-generator/types';
import { Badge } from '@cv-generator/ui';
import { Mail, Phone, MapPin, Linkedin, Globe, ExternalLink } from 'lucide-react';

interface TemplateProps {
  data: CVData;
}

export function ClassicTemplate({ data }: TemplateProps) {
  const { personalInfo, professionalSummary, experience, education, skills, projects } = data;

  return (
    <div className="bg-white text-gray-900 max-w-4xl mx-auto print:shadow-none">
      {/* Header */}
      <header className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{personalInfo?.fullName || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          {personalInfo?.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo?.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo?.linkedIn && (
            <div className="flex items-center gap-1">
              <Linkedin className="w-4 h-4" />
              <span>{personalInfo.linkedIn}</span>
            </div>
          )}
          {personalInfo?.website && (
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span>{personalInfo.website}</span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="space-y-6">
        {/* Summary */}
        {professionalSummary && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">Professional Summary</h2>
            <hr className="border-gray-400 mb-3" />
            <p className="text-gray-800 leading-relaxed">{professionalSummary}</p>
          </section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">Experience</h2>
            <hr className="border-gray-400 mb-3" />
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex flex-col md:flex-row md:justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-gray-700 font-medium">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                  </div>
                  <p className="font-medium text-gray-800">{exp.company}</p>
                  {exp.location && <p className="text-gray-600 text-sm mb-2">{exp.location}</p>}
                  <p className="text-gray-700 mt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">Education</h2>
            <hr className="border-gray-400 mb-3" />
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index}>
                  <div className="flex flex-col md:flex-row md:justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                    <p className="text-gray-700 font-medium">{edu.startDate} - {edu.endDate}</p>
                  </div>
                  <p className="font-medium text-gray-800">{edu.institution}</p>
                  {edu.gpa && <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">Skills</h2>
            <hr className="border-gray-400 mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {skills.map((skill, index) => (
                <div key={index} className="text-gray-800">
                  • {skill.name}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">Projects</h2>
            <hr className="border-gray-400 mb-3" />
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  {project.technologies && project.technologies.length > 0 && (
                    <p className="text-gray-600 text-sm mb-1">
                      <strong>Technologies:</strong> {project.technologies.join(', ')}
                    </p>
                  )}
                  <p className="text-gray-700 mt-1">{project.description}</p>
                  {project.link && (
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-700 hover:underline mt-1 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

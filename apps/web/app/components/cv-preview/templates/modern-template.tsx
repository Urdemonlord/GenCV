'use client';

import { CVData } from '@cv-generator/types';
import { Badge } from '@cv-generator/ui';
import { Mail, Phone, MapPin, Linkedin, Globe, ExternalLink } from 'lucide-react';

interface TemplateProps {
  data: CVData;
}

export function ModernTemplate({ data }: TemplateProps) {
  const { personalInfo, professionalSummary, experience, education, skills, projects } = data;

  return (
    <div className="bg-white text-gray-800 shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
          <div>
            <h1 className="text-3xl font-bold">{personalInfo?.fullName || 'Your Name'}</h1>
            <p className="text-xl mt-1 opacity-90">Professional</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            {personalInfo?.email && (
              <div className="flex items-center gap-2 justify-end">
                <Mail className="w-4 h-4" />
                <span>{personalInfo.email}</span>
              </div>
            )}
            {personalInfo?.phone && (
              <div className="flex items-center gap-2 justify-end mt-1">
                <Phone className="w-4 h-4" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo?.location && (
              <div className="flex items-center gap-2 justify-end mt-1">
                <MapPin className="w-4 h-4" />
                <span>{personalInfo.location}</span>
              </div>
            )}
            {personalInfo?.linkedIn && (
              <div className="flex items-center gap-2 justify-end mt-1">
                <Linkedin className="w-4 h-4" />
                <span>{personalInfo.linkedIn}</span>
              </div>
            )}
            {personalInfo?.website && (
              <div className="flex items-center gap-2 justify-end mt-1">
                <Globe className="w-4 h-4" />
                <span>{personalInfo.website}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Summary */}
        {professionalSummary && (
          <section className="mb-8">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3 text-blue-600">Professional Summary</h2>
            <p className="text-gray-700 leading-relaxed">{professionalSummary}</p>
          </section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4 text-blue-600">Experience</h2>
            <div className="space-y-6">
              {experience.map((exp, index) => (
                <div key={index} className="relative pl-6 border-l-2 border-blue-200">
                  <div className="absolute top-0 left-[-9px] w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div className="flex flex-col md:flex-row md:justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{exp.position}</h3>
                    <p className="text-gray-600">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                  </div>
                  <p className="font-medium text-blue-700">{exp.company}</p>
                  {exp.location && <p className="text-gray-600 text-sm mb-2">{exp.location}</p>}
                  <p className="mt-2 text-gray-700">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4 text-blue-600">Education</h2>
            <div className="space-y-6">
              {education.map((edu, index) => (
                <div key={index} className="relative pl-6 border-l-2 border-blue-200">
                  <div className="absolute top-0 left-[-9px] w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div className="flex flex-col md:flex-row md:justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{edu.degree} in {edu.field}</h3>
                    <p className="text-gray-600">{edu.startDate} - {edu.endDate}</p>
                  </div>
                  <p className="font-medium text-blue-700">{edu.institution}</p>
                  {edu.gpa && <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3 text-blue-600">Skills</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map((skill, index) => (
                <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section>
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4 text-blue-600">Projects</h2>
            <div className="space-y-6">
              {projects.map((project, index) => (
                <div key={index} className="relative pl-6 border-l-2 border-blue-200">
                  <div className="absolute top-0 left-[-9px] w-4 h-4 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="outline" className="text-xs border-blue-300 text-blue-700">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-gray-700">{project.description}</p>
                  {project.link && (
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2 text-sm"
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

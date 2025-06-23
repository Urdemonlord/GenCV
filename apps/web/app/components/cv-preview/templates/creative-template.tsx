'use client';

import { CVData } from '@cv-generator/types';
import { Badge } from '@cv-generator/ui';
import { Mail, Phone, MapPin, Linkedin, Globe, ExternalLink } from 'lucide-react';

interface TemplateProps {
  data: CVData;
}

export function CreativeTemplate({ data }: TemplateProps) {
  const { personalInfo, professionalSummary, experience, education, skills, projects } = data;

  return (
    <div className="bg-white text-gray-800 max-w-4xl mx-auto print:shadow-none">
      {/* Header */}
      <header className="bg-gradient-to-br from-pink-400 via-purple-500 to-orange-500 text-white p-8 rounded-t-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{personalInfo?.fullName || 'Your Name'}</h1>
            <p className="text-xl opacity-90">Creative Professional</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            {personalInfo?.email && (
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{personalInfo.email}</span>
              </div>
            )}
            {personalInfo?.phone && (
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo?.location && (
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{personalInfo.location}</span>
              </div>
            )}
            {personalInfo?.linkedIn && (
              <div className="flex items-center gap-2 mb-1">
                <Linkedin className="w-4 h-4" />
                <span className="text-sm">{personalInfo.linkedIn}</span>
              </div>
            )}
            {personalInfo?.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm">{personalInfo.website}</span>
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
            <div className="flex items-center mb-4">
              <div className="w-2 h-8 bg-gradient-to-b from-pink-400 to-orange-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                About Me
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed pl-5">{professionalSummary}</p>
          </section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Experience
              </h2>
            </div>
            <div className="space-y-6 pl-5">
              {experience.map((exp, index) => (
                <div key={index} className="relative">
                  <div className="absolute left-[-20px] top-2 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-400">
                    <div className="flex flex-col md:flex-row md:justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{exp.position}</h3>
                      <p className="text-purple-600 font-medium">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                    </div>
                    <p className="font-medium text-purple-700">{exp.company}</p>
                    {exp.location && <p className="text-gray-600 text-sm mb-2">{exp.location}</p>}
                    <p className="text-gray-700 mt-2">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-red-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Education
              </h2>
            </div>
            <div className="space-y-4 pl-5">
              {education.map((edu, index) => (
                <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border-l-4 border-orange-400">
                  <div className="flex flex-col md:flex-row md:justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{edu.degree} in {edu.field}</h3>
                    <p className="text-orange-600 font-medium">{edu.startDate} - {edu.endDate}</p>
                  </div>
                  <p className="font-medium text-orange-700">{edu.institution}</p>
                  {edu.gpa && <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-2 h-8 bg-gradient-to-b from-green-400 to-blue-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                Skills
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 pl-5">
              {skills.map((skill, index) => (
                <Badge 
                  key={index} 
                  className="bg-gradient-to-r from-green-100 to-blue-100 text-gray-800 hover:from-green-200 hover:to-blue-200 px-4 py-2 rounded-full border border-green-200"
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section>
            <div className="flex items-center mb-4">
              <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Projects
              </h2>
            </div>
            <div className="space-y-6 pl-5">
              {projects.map((project, index) => (
                <div key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-l-4 border-indigo-400">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.name}</h3>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {project.technologies.map((tech, techIndex) => (
                        <span 
                          key={techIndex} 
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-700 mb-2">{project.description}</p>
                  {project.link && (
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm font-medium"
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

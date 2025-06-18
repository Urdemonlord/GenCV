'use client';

import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Code } from 'lucide-react';
import { CVData, Project } from '@cv-generator/types';
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle, Badge } from '@cv-generator/ui';
import { generateId } from '@cv-generator/utils';
import { StepProps } from '../types';

export function ProjectsStep({ cvData, onDataChange, onNext, onPrevious, isFirst }: StepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addProject = () => {
    const newProject: Project = {
      id: generateId(),
      name: '',
      description: '',
      technologies: [],
      link: '',
    };

    onDataChange({
      ...cvData,
      projects: [...cvData.projects, newProject],
    });
    setEditingId(newProject.id);
  };

  const updateProject = (id: string, field: keyof Project, value: string | string[]) => {
    onDataChange({
      ...cvData,
      projects: cvData.projects.map(project =>
        project.id === id ? { ...project, [field]: value } : project
      ),
    });
  };

  const deleteProject = (id: string) => {
    onDataChange({
      ...cvData,
      projects: cvData.projects.filter(project => project.id !== id),
    });
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleTechnologiesChange = (id: string, value: string) => {
    const technologies = value.split(',').map(tech => tech.trim()).filter(Boolean);
    updateProject(id, 'technologies', technologies);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Projects</h2>
        <p className="text-muted-foreground">
          Showcase your projects, side projects, or significant contributions.
        </p>
      </div>

      <div className="space-y-4">
        {cvData.projects.map((project) => (
          <Card key={project.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {project.name || 'New Project'}
                  {project.link && (
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4 inline" />
                    </a>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === project.id ? null : project.id)}
                  >
                    {editingId === project.id ? 'Collapse' : 'Edit'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>

            {editingId === project.id && (
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <Code className="inline w-4 h-4 mr-1" />
                      Project Name *
                    </label>
                    <Input
                      value={project.name}
                      onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                      placeholder="Project Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <ExternalLink className="inline w-4 h-4 mr-1" />
                      Project URL (Optional)
                    </label>
                    <Input
                      value={project.link || ''}
                      onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                      placeholder="https://github.com/username/project"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Technologies Used
                  </label>
                  <Input
                    value={project.technologies.join(', ')}
                    onChange={(e) => handleTechnologiesChange(project.id, e.target.value)}
                    placeholder="React, Node.js, MongoDB (comma-separated)"
                  />
                  <span className="text-xs text-muted-foreground">
                    Separate technologies with commas
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Project Description *
                  </label>
                  <Textarea
                    value={project.description}
                    onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                    placeholder="Describe what the project does, your role, key features, and impact..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addProject}
          className="w-full py-6 border-dashed border-2 hover:border-blue-400"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <h4 className="font-medium mb-2">💡 Project Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Include personal projects, open source contributions, or freelance work</li>
          <li>• Mention the technologies and tools you used</li>
          <li>• Describe the problem solved and your approach</li>
          <li>• Include live demos or GitHub links when possible</li>
        </ul>
      </div>

      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}
        <Button onClick={onNext} className="ml-auto">
          Finish
        </Button>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Code, Sparkles, RefreshCw } from 'lucide-react';
import { CVData, Project } from '@cv-generator/types';
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle, Badge } from '@cv-generator/ui';
import { generateId } from '@cv-generator/utils';
import { StepProps } from '../types';
import { useRouter } from 'next/navigation';

export function ProjectsStep({ cvData, onDataChange, onNext, onPrevious, isFirst }: StepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatingDescriptions, setGeneratingDescriptions] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

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
    // Clear error when user updates the field
    if (errors[id]) {
      setErrors(prev => ({...prev, [id]: ''}));
    }
  };

  const deleteProject = (id: string) => {
    onDataChange({
      ...cvData,
      projects: cvData.projects.filter(project => project.id !== id),
    });
    if (editingId === id) {
      setEditingId(null);
    }
    // Clear any errors for this project
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleTechnologiesChange = (id: string, value: string) => {
    const technologies = value.split(',').map(tech => tech.trim()).filter(Boolean);
    updateProject(id, 'technologies', technologies);
  };

  const generateDescription = async (projectId: string) => {
    const project = cvData.projects.find(p => p.id === projectId);
    if (!project) return;

    if (!project.name.trim()) {
      setErrors(prev => ({...prev, [projectId]: 'Please enter a project name first'}));
      return;
    }

    if (project.technologies.length === 0) {
      setErrors(prev => ({...prev, [projectId]: 'Please add some technologies first'}));
      return;
    }

    setGeneratingDescriptions(prev => ({...prev, [projectId]: true}));
    setErrors(prev => ({...prev, [projectId]: ''}));

    try {
      const response = await fetch(`/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'project',
          projectName: project.name,
          technologies: project.technologies,
          projectType: 'Web/Software Project'
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        updateProject(projectId, 'description', result.data);
      } else {
        setErrors(prev => ({...prev, [projectId]: result.error || 'Failed to generate description. Please try again.'}));
      }
    } catch (error) {
      setErrors(prev => ({...prev, [projectId]: 'Network error. Please check your connection and try again.'}));
    } finally {
      setGeneratingDescriptions(prev => ({...prev, [projectId]: false}));
    }
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
                </div>                <div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">
                      Project Description *
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateDescription(project.id)}
                      disabled={generatingDescriptions[project.id] || !project.name.trim() || project.technologies.length === 0}
                      className="flex items-center gap-2"
                      title={
                        !project.name.trim() 
                          ? "Enter project name first" 
                          : project.technologies.length === 0 
                          ? "Add technologies first" 
                          : "Generate AI description"
                      }
                    >
                      {generatingDescriptions[project.id] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {generatingDescriptions[project.id] ? 'Generating...' : 'AI Generate'}
                    </Button>
                  </div>
                  <Textarea
                    value={project.description}
                    onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                    placeholder="Describe what the project does, your role, key features, and impact..."
                    className="min-h-[100px]"
                  />
                  {errors[project.id] && (
                    <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950 p-2 rounded mt-2">
                      {errors[project.id]}
                    </div>
                  )}
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
      </div>      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <h4 className="font-medium mb-2">💡 Project Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Include personal projects, open source contributions, or freelance work</li>
          <li>• Add project name and technologies first, then use AI to generate descriptions</li>
          <li>• Mention the technologies and tools you used</li>
          <li>• Describe the problem solved and your approach</li>
          <li>• Include live demos or GitHub links when possible</li>
        </ul>
      </div>      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}
        <Button 
          onClick={() => router.push('/result')} 
          className="ml-auto bg-green-600 hover:bg-green-700"
        >
          Finish & View CV
        </Button>
      </div>
    </div>
  );
}
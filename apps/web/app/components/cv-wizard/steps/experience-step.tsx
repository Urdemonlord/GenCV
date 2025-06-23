'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar, Building2, MapPin, Sparkles } from 'lucide-react';
import { CVData, Experience } from '@cv-generator/types';
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle } from '@cv-generator/ui';
import { generateId } from '@cv-generator/utils';
import { StepProps } from '../types';

export function ExperienceStep({ cvData, onDataChange, onNext, onPrevious, isFirst }: StepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addExperience = () => {
    const newExperience: Experience = {
      id: generateId(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };

    onDataChange({
      ...cvData,
      experience: [...cvData.experience, newExperience],
    });
    setEditingId(newExperience.id);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    onDataChange({
      ...cvData,
      experience: cvData.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const deleteExperience = (id: string) => {
    onDataChange({
      ...cvData,
      experience: cvData.experience.filter(exp => exp.id !== id),
    });
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const enhanceDescription = async (id: string) => {
    const experience = cvData.experience.find(exp => exp.id === id);
    if (!experience || !experience.description.trim()) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/rewrite-experience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: experience.description,
          role: experience.position,
          company: experience.company,
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        updateExperience(id, 'description', result.data);
      }
    } catch (error) {
      console.error('Failed to enhance description:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Work Experience</h2>
        <p className="text-muted-foreground">
          Add your work experience. Use the AI enhance feature to improve your descriptions.
        </p>
      </div>

      <div className="space-y-4">
        {cvData.experience.map((exp) => (
          <Card key={exp.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {exp.position || 'New Position'} 
                  {exp.company && <span className="text-muted-foreground"> at {exp.company}</span>}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === exp.id ? null : exp.id)}
                  >
                    {editingId === exp.id ? 'Collapse' : 'Edit'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExperience(exp.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {editingId === exp.id && (
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <Building2 className="inline w-4 h-4 mr-1" />
                      Company *
                    </label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      placeholder="Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Position *
                    </label>
                    <Input
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      placeholder="Job Title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Location
                    </label>
                    <Input
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      placeholder="City, State"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        disabled={exp.current}
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => {
                          updateExperience(exp.id, 'current', e.target.checked);
                          if (e.target.checked) {
                            updateExperience(exp.id, 'endDate', '');
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">I currently work here</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Job Description
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => enhanceDescription(exp.id)}
                      disabled={!exp.description.trim()}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI Enhance
                    </Button>
                  </div>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    placeholder="Describe your responsibilities, achievements, and impact in this role..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addExperience}
          className="w-full py-6 border-dashed border-2 hover:border-blue-400"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Work Experience
        </Button>
      </div>

      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}
        <Button onClick={onNext} className="ml-auto">
          Next
        </Button>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar, Building2, MapPin, Sparkles } from 'lucide-react';
import { CV, Experience } from '@/lib/cv/schema';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@cv-generator/ui';
import { generateId } from '@cv-generator/utils';
import { StepProps } from '../types';
import { MonthYearInput } from '../month-year-input';
import { BulletEditor } from '../bullet-editor';
import { toBulletList } from '@/lib/cv/format';
import { getApiUrl } from '@/lib/api-url';

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
      bullets: [''],
    };

    onDataChange((previous) => ({
      ...previous,
      experience: [...previous.experience, newExperience],
    }));
    setEditingId(newExperience.id);
  };

  const updateExperience = (id: string, patch: Partial<Experience>) => {
    onDataChange((previous) => ({
      ...previous,
      experience: previous.experience.map((exp) => (exp.id === id ? { ...exp, ...patch } : exp)),
    }));
  };

  const deleteExperience = (id: string) => {
    onDataChange((previous) => ({
      ...previous,
      experience: previous.experience.filter((exp) => exp.id !== id),
    }));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const enhanceDescription = async (id: string) => {
    const experience = cvData.experience.find(exp => exp.id === id);
    if (!experience || !experience.bullets.some((b) => b.trim())) return;

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'experience',
          text: experience.bullets.filter((b) => b.trim()).map((b) => '- ' + b).join('\n'),
          role: experience.position,
          company: experience.company,
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        updateExperience(id, { bullets: toBulletList(result.data) });
      }
    } catch (error) {
      console.error('Failed to enhance description:', error);
      alert(`Failed to enhance description: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      placeholder="Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Position *
                    </label>
                    <Input
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                      placeholder="Job Title"
                    />
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium mb-1">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Location
                    </label>
                    <Input
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                      placeholder="City, Country (or Remote)"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-medium mb-1">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Start Date
                    </span>
                    <MonthYearInput
                      label="Start date"
                      value={exp.startDate}
                      onChange={(value) => updateExperience(exp.id, { startDate: value })}
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-medium mb-1">End Date</span>
                    {exp.current ? (
                      <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground">
                        Present
                      </div>
                    ) : (
                      <MonthYearInput
                        label="End date"
                        value={exp.endDate}
                        onChange={(value) => updateExperience(exp.id, { endDate: value })}
                      />
                    )}
                  </div>

                  <div className="col-span-full">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) =>
                          // One update for both fields; two separate updates would overwrite each other.
                          updateExperience(exp.id, {
                            current: e.target.checked,
                            endDate: e.target.checked ? '' : exp.endDate,
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm">I currently work here</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-sm text-muted-foreground">One achievement per bullet, starting with an action verb.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => enhanceDescription(exp.id)}
                      disabled={!exp.bullets.some((b) => b.trim())}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI Enhance
                    </Button>
                  </div>
                  <BulletEditor
                    label="Achievements"
                    bullets={exp.bullets}
                    onChange={(bullets) => updateExperience(exp.id, { bullets })}
                    placeholder="e.g. Cut report preparation time by 30% by automating it with Python"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addExperience}
          className="w-full py-6 border-dashed border-2 hover:border-primary/60"
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
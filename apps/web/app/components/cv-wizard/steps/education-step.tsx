'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar, GraduationCap, BookOpen } from 'lucide-react';
import { CVData, Education } from '@cv-generator/types';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@cv-generator/ui';
import { generateId } from '@cv-generator/utils';
import { StepProps } from '../types';

export function EducationStep({ cvData, onDataChange, onNext, onPrevious, isFirst }: StepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addEducation = () => {
    const newEducation: Education = {
      id: generateId(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };

    onDataChange({
      ...cvData,
      education: [...cvData.education, newEducation],
    });
    setEditingId(newEducation.id);
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onDataChange({
      ...cvData,
      education: cvData.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const deleteEducation = (id: string) => {
    onDataChange({
      ...cvData,
      education: cvData.education.filter(edu => edu.id !== id),
    });
    if (editingId === id) {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Education</h2>
        <p className="text-muted-foreground">
          Add your educational background, degrees, and certifications.
        </p>
      </div>

      <div className="space-y-4">
        {cvData.education.map((edu) => (
          <Card key={edu.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {edu.degree || 'New Degree'} 
                  {edu.field && <span className="text-muted-foreground"> in {edu.field}</span>}
                  {edu.institution && <span className="text-muted-foreground"> - {edu.institution}</span>}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === edu.id ? null : edu.id)}
                  >
                    {editingId === edu.id ? 'Collapse' : 'Edit'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEducation(edu.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {editingId === edu.id && (
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <GraduationCap className="inline w-4 h-4 mr-1" />
                      Institution *
                    </label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      placeholder="University Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Degree *
                    </label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      placeholder="Bachelor's, Master's, PhD, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <BookOpen className="inline w-4 h-4 mr-1" />
                      Field of Study *
                    </label>
                    <Input
                      value={edu.field}
                      onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                      placeholder="Computer Science, Business, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      GPA (Optional)
                    </label>
                    <Input
                      value={edu.gpa || ''}
                      onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                      placeholder="3.8/4.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addEducation}
          className="w-full py-6 border-dashed border-2 hover:border-blue-400"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Education
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
'use client';

import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { CVData, Skill } from '@cv-generator/types';
import { Button, Input, Card, CardContent, Badge } from '@cv-generator/ui';
import { generateId } from '@cv-generator/utils';
import { StepProps } from '../types';

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
const skillCategories = ['Technical', 'Soft', 'Language'] as const;

export function SkillsStep({ cvData, onDataChange, onNext, onPrevious, isFirst }: StepProps) {
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate' as const, category: 'Technical' as const });
  const [isGenerating, setIsGenerating] = useState(false);

  const addSkill = () => {
    if (!newSkill.name.trim()) return;

    const skill: Skill = {
      id: generateId(),
      name: newSkill.name.trim(),
      level: newSkill.level,
      category: newSkill.category,
    };

    onDataChange({
      ...cvData,
      skills: [...cvData.skills, skill],
    });

    setNewSkill({ name: '', level: 'Intermediate', category: 'Technical' });
  };

  const deleteSkill = (id: string) => {
    onDataChange({
      ...cvData,
      skills: cvData.skills.filter(skill => skill.id !== id),
    });
  };

  const suggestSkills = async () => {
    setIsGenerating(true);
    
    try {
      const targetRole = 'Software Developer'; // This could be extracted from experience or made configurable
      
      const response = await fetch('/api/suggest-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: targetRole,
          experienceLevel: cvData.experienceLevel,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const suggestedSkills = result.data.split(',').map((skill: string) => skill.trim());
        const newSkills: Skill[] = suggestedSkills
          .filter((skillName: string) => 
            skillName && !cvData.skills.some(existing => 
              existing.name.toLowerCase() === skillName.toLowerCase()
            )
          )
          .slice(0, 8) // Limit to 8 suggestions
          .map((skillName: string) => ({
            id: generateId(),
            name: skillName,
            level: 'Intermediate' as const,
            category: 'Technical' as const,
          }));

        onDataChange({
          ...cvData,
          skills: [...cvData.skills, ...newSkills],
        });
      }
    } catch (error) {
      console.error('Failed to generate skills:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const groupedSkills = cvData.skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Skills</h2>
        <p className="text-muted-foreground">
          Add your technical skills, soft skills, and languages. Use AI to get relevant suggestions.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Skills</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={suggestSkills}
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {isGenerating ? 'Generating...' : 'AI Suggest'}
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="Skill name (e.g., JavaScript, Leadership)"
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
            </div>
            
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as any })}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              {skillLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>

            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as any })}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              {skillCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <Button onClick={addSkill} disabled={!newSkill.name.trim()} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </CardContent>
      </Card>

      {Object.keys(groupedSkills).length > 0 && (
        <div className="space-y-4">
          {skillCategories.map(category => {
            const categorySkills = groupedSkills[category];
            if (!categorySkills || categorySkills.length === 0) return null;

            return (
              <Card key={category}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">{category} Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map(skill => (
                      <div key={skill.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        <Badge variant="secondary">{skill.name}</Badge>
                        <span className="text-xs text-muted-foreground">{skill.level}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSkill(skill.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
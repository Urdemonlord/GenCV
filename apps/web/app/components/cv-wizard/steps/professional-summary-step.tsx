'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { CVData } from '@cv-generator/types';
import { Button, Textarea, Card, CardContent, Badge } from '@cv-generator/ui';
import { StepProps } from '../types';

export function ProfessionalSummaryStep({ cvData, onDataChange, onNext, onPrevious, isFirst }: StepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (value: string) => {
    onDataChange({
      ...cvData,
      professionalSummary: value,
    });
    setError('');
  };

  const generateSummary = async () => {
    if (cvData.skills.length === 0) {
      setError('Please add some skills first to generate a professional summary.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const skills = cvData.skills.map(skill => skill.name);
      const targetRole = 'Software Developer'; // This could be extracted from experience or made configurable
      
      const response = await fetch('/api/summarize-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceLevel: cvData.experienceLevel,
          role: targetRole,
          skills: skills,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        handleChange(result.data);
      } else {
        setError(result.error || 'Failed to generate summary. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (!cvData.professionalSummary.trim()) {
      setError('Please write or generate a professional summary before proceeding.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Professional Summary</h2>
        <p className="text-muted-foreground">
          Write a compelling summary that highlights your key qualifications and career goals.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium">
              Professional Summary *
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={generateSummary}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </Button>
          </div>

          <Textarea
            value={cvData.professionalSummary}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write a 2-3 sentence summary highlighting your experience, skills, and career objectives..."
            className="min-h-[120px] resize-none"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{cvData.professionalSummary.length} characters</span>
            <Badge variant={cvData.professionalSummary.length >= 100 ? 'default' : 'secondary'}>
              {cvData.professionalSummary.length >= 100 ? 'Good length' : 'Too short'}
            </Badge>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950 p-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded text-sm">
            <h4 className="font-medium mb-2">💡 Tips for a great summary:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Keep it concise (2-3 sentences)</li>
              <li>• Highlight your most relevant skills</li>
              <li>• Mention years of experience (if applicable)</li>
              <li>• Include your career objectives</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}
        <Button onClick={handleNext} className="ml-auto">
          Next
        </Button>
      </div>
    </div>
  );
}
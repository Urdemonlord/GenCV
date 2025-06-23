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
    // Debug: Log skills data
    console.log('🐛 Debug Skills Data:', {
      skillsLength: cvData.skills?.length || 0,
      skills: cvData.skills,
      fullCvData: cvData
    });

    // Allow generation even without skills, use fallback defaults
    const skillsList = cvData.skills?.length > 0 
      ? cvData.skills.map(skill => skill.name) 
      : ['JavaScript', 'React', 'TypeScript', 'Problem Solving', 'Team Collaboration'];
    
    setIsGenerating(true);
    setError('');

    try {
      // Extract role from experience if available, otherwise use default
      const targetRole = cvData.experience?.length > 0 
        ? cvData.experience[0].position 
        : 'Software Developer';
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/summarize-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          experienceLevel: cvData.experienceLevel,
          role: targetRole,
          skills: skillsList,
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
      </div>      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Skills Status Display */}
          {cvData.skills?.length > 0 ? (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded mb-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Your skills ({cvData.skills.length}):
                </span>
                {cvData.skills.slice(0, 5).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                    {skill.name}
                  </Badge>
                ))}
                {cvData.skills.length > 5 && (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    +{cvData.skills.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                <strong>💡 Tip:</strong> Adding skills will help generate a more personalized summary. 
                You can still generate with our defaults, but results will be better with your own skills.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onPrevious} 
                  className="text-amber-700 border-amber-300 hover:bg-amber-100"
                >
                  ← Add Skills First
                </Button>
                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                  or continue with default skills: JavaScript, React, TypeScript...
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium">
              Professional Summary *
            </label>            <Button
              variant="outline"
              size="sm"
              onClick={generateSummary}
              disabled={isGenerating}
              className="flex items-center gap-2"
              title={cvData.skills?.length > 0 
                ? "Generate AI summary based on your skills" 
                : "Generate AI summary with default skills"
              }
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : (cvData.skills?.length > 0 ? 'AI Generate' : 'AI Generate (Default)')}
            </Button>
          </div>          <Textarea
            value={cvData.professionalSummary}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={cvData.skills?.length > 0 
              ? "Click 'AI Generate' to create a personalized summary based on your skills, or write your own compelling 2-3 sentence summary..." 
              : "Write a compelling summary highlighting your experience, skills, and career objectives, or click 'AI Generate' for a default template..."
            }
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
          )}          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded text-sm">
            <h4 className="font-medium mb-2">💡 Tips for a great summary:</h4>
            <ul className="space-y-1 text-muted-foreground mb-3">
              <li>• Keep it concise (2-3 sentences)</li>
              <li>• Highlight your most relevant skills</li>
              <li>• Mention years of experience (if applicable)</li>
              <li>• Include your career objectives</li>
            </ul>
            <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900 rounded">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Example:</p>              <p className="text-blue-700 dark:text-blue-300 text-xs italic">
                &ldquo;Experienced software developer with 5+ years creating web applications using React, TypeScript, and Node.js. 
                Passionate about building clean, maintainable code and optimizing application performance. 
                Committed to delivering exceptional user experiences through innovative solutions.&rdquo;
              </p>
            </div>
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
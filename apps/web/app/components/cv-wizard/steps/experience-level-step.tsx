'use client';

import { GraduationCap, Briefcase } from 'lucide-react';
import { CVData } from '@cv-generator/types';
import { Button, Card, CardContent } from '@cv-generator/ui';
import { StepProps } from '../types';

export function ExperienceLevelStep({ cvData, onDataChange, onNext }: StepProps) {
  const handleLevelSelect = (level: 'fresh' | 'professional') => {
    onDataChange({
      ...cvData,
      experienceLevel: level,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">What's your experience level?</h2>
        <p className="text-muted-foreground">
          This helps us customize the form and provide better AI suggestions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cvData.experienceLevel === 'fresh' 
              ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => handleLevelSelect('fresh')}
        >
          <CardContent className="p-6 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Fresh Graduate</h3>
            <p className="text-sm text-muted-foreground">
              Recent graduate or entry-level professional with limited work experience
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cvData.experienceLevel === 'professional' 
              ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => handleLevelSelect('professional')}
        >
          <CardContent className="p-6 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Professional</h3>
            <p className="text-sm text-muted-foreground">
              Experienced professional with work history and achievements
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={onNext}
          disabled={!cvData.experienceLevel}
          className="min-w-[100px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
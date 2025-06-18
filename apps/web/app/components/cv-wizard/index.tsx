'use client';

import { useState } from 'react';
import { CVData } from '@cv-generator/types';
import { StepIndicator } from './step-indicator';
import { ExperienceLevelStep } from './steps/experience-level-step';
import { PersonalInfoStep } from './steps/personal-info-step';
import { ProfessionalSummaryStep } from './steps/professional-summary-step';
import { ExperienceStep } from './steps/experience-step';
import { EducationStep } from './steps/education-step';
import { SkillsStep } from './steps/skills-step';
import { ProjectsStep } from './steps/projects-step';

interface CVWizardProps {
  cvData: CVData;
  onDataChange: (data: CVData) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
}

const steps = [
  { id: 'experience-level', title: 'Experience Level', component: ExperienceLevelStep },
  { id: 'personal-info', title: 'Personal Information', component: PersonalInfoStep },
  { id: 'summary', title: 'Professional Summary', component: ProfessionalSummaryStep },
  { id: 'experience', title: 'Work Experience', component: ExperienceStep },
  { id: 'education', title: 'Education', component: EducationStep },
  { id: 'skills', title: 'Skills', component: SkillsStep },
  { id: 'projects', title: 'Projects', component: ProjectsStep },
];

export function CVWizard({ cvData, onDataChange, currentStep, onStepChange }: CVWizardProps) {
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="space-y-6">
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={onStepChange}
      />
      
      <div className="min-h-[400px]">
        <CurrentStepComponent
          cvData={cvData}
          onDataChange={onDataChange}
          onNext={() => onStepChange(Math.min(currentStep + 1, steps.length - 1))}
          onPrevious={() => onStepChange(Math.max(currentStep - 1, 0))}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
        />
      </div>
    </div>
  );
}
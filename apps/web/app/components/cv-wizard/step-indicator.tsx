'use client';

import { Check } from 'lucide-react';
import { cn } from '@cv-generator/ui';

interface Step {
  id: string;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <button
              onClick={() => onStepClick(index)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              )}
            >
              {index < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </button>
            
            <span className={cn(
              'text-xs mt-2 text-center max-w-[80px] leading-tight',
              index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {step.title}
            </span>
            
            {index < steps.length - 1 && (
              <div className={cn(
                'absolute h-0.5 w-full top-4 left-1/2 transform -translate-y-1/2',
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              )} style={{ 
                marginLeft: '50%',
                width: `${100 / steps.length}%`,
                zIndex: -1
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
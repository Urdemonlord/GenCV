import { CVData } from '@cv-generator/types';

export interface StepProps {
  cvData: CVData;
  onDataChange: (data: CVData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}
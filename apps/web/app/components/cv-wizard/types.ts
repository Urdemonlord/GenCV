import { CVData } from '@cv-generator/types';

/**
 * Prefer the updater form for anything that depends on existing data: async callbacks
 * (AI responses) and multi-field edits would otherwise overwrite newer changes with a
 * stale copy of the CV.
 */
export type CVDataUpdate = CVData | ((previous: CVData) => CVData);

export interface StepProps {
  cvData: CVData;
  onDataChange: (update: CVDataUpdate) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

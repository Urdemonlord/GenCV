import { CV } from '@/lib/cv/schema';

/**
 * Prefer the updater form for anything that depends on existing data: async callbacks
 * (AI responses) and multi-field edits would otherwise overwrite newer changes with a
 * stale copy of the CV.
 */
export type CVDataUpdate = CV | ((previous: CV) => CV);

export interface StepProps {
  cvData: CV;
  onDataChange: (update: CVDataUpdate) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

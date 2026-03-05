import type { StepProps } from '../database-form.types.js';

export type StepInfo = {
  component: React.ComponentType<StepProps>;
  label: string;
};

export type DatabaseFormBodyProps = {
  activeStep: number;
  longestAchievedStep: number;
  disableNext?: boolean;
  isSubmitting: boolean;
  hasErrors: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
};

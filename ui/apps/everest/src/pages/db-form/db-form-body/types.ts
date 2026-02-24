import React from 'react';

export type StepInfo = {
  component: React.ComponentType<any>;
  label: string;
};

export type DBFormBodyProps = {
  steps: StepInfo[];
  activeStep: number;
  longestAchievedStep: number;
  isSubmitting: boolean;
  hasErrors: boolean;
  disableNext: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
};

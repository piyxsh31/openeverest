import { Section } from 'components/ui-generator/ui-generator.types';

export type StepInfo = {
  component: React.ComponentType<any>;
  label: string;
};

export type DatabaseFormBodyProps = {
  sections: { [key: string]: Section };
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

export type DatabaseFormStepControllersProps = {
  disableBack?: boolean;
  disableNext?: boolean;
  disableSubmit?: boolean;
  disableCancel?: boolean;
  showSubmit?: boolean;
  onPreviousClick: () => void;
  onNextClick: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

import { StackProps } from '@mui/material';

export interface DbFormPreviewProps extends StackProps {
  activeStep: number;
  longestAchievedStep: number;
  onSectionEdit?: (order: number) => void;
  disabled: boolean;
  stepsWithErrors: number[];
}

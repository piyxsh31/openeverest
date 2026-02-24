export interface DbFormSideDrawerProps {
  activeStep: number;
  longestAchievedStep: number;
  handleSectionEdit: (order: number) => void;
  disabled: boolean;
  stepsWithErrors: number[];
}

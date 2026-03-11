export type DatabaseFormSideDrawerProps = {
  activeStep: number;
  disabled: boolean;
  stepsWithErrors: number[];
  handleSectionEdit: (section: number) => void;
};

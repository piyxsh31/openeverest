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
  showConfigMore?: boolean;
};

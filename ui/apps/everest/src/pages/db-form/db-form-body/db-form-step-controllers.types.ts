export type DbFormStepControllersProps = {
  disableBack?: boolean;
  disableNext?: boolean;
  disableSubmit?: boolean;
  disableCancel?: boolean;
  showSubmit?: boolean;
  onPreviousClick: () => void;
  onNextClick: () => void;
  onCancel: () => void;
};

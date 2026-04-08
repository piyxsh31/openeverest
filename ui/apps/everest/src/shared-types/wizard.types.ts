import { FormMode } from 'components/ui-generator/ui-generator.types';

/** @deprecated Use FormMode from ui-generator types directly */
export const WizardMode = FormMode;
/** @deprecated Use FormMode from ui-generator types directly */
export type WizardMode = FormMode;

export type ScheduleWizardMode = Exclude<FormMode, FormMode.Restore>;

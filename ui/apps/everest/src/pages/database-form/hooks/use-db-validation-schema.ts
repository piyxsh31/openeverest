import { WizardMode } from 'shared-types/wizard.types.ts';
import { DbWizardType, getDBWizardSchema } from '../database-form-schema.js';
import { DbClusterName } from '../database-form.types.js';
import { ZodTypeAny } from 'zod';

export const useDbValidationSchema = (
  activeStep: number,
  defaultValues: DbWizardType,
  dbClusters: DbClusterName[],
  mode: WizardMode,
  hasImportStep: boolean,
  openApiValidationSchema?: ZodTypeAny
) => {
  // This hook was left to leave an ability of validation depending on mode or other params
  return getDBWizardSchema(
    activeStep,
    defaultValues,
    dbClusters,
    mode,
    hasImportStep,
    openApiValidationSchema
  );
};

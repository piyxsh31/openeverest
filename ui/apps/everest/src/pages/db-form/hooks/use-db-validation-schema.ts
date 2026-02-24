import { DbClusterName } from 'pages/database-form/database-form.types';
import { WizardMode } from 'shared-types/wizard.types';
import { getDBWizardSchema } from '../utils/get-db-form-schema';
import { ZodTypeAny } from 'zod';

export const useDbValidationSchema = (
  activeStep: number,
  defaultValues: any, //TODO add type
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

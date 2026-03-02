import { useMemo } from 'react';
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
  const schema = useMemo(() => {
    return getDBWizardSchema(
      activeStep,
      defaultValues,
      dbClusters,
      mode,
      hasImportStep,
      openApiValidationSchema
    );
  }, [
    activeStep,
    defaultValues,
    dbClusters,
    mode,
    hasImportStep,
    openApiValidationSchema,
  ]);

  return schema;
};

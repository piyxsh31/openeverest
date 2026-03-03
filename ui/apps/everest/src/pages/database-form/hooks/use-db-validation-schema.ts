import { useMemo } from 'react';
import { getDBWizardSchema } from '../database-form-schema.js';
import { DbClusterName } from '../database-form.types.js';
import { ZodTypeAny } from 'zod';

export const useDbValidationSchema = (
  dbClusters: DbClusterName[],
  hasImportStep: boolean,
  openApiValidationSchema?: ZodTypeAny
) => {
  const schema = useMemo(() => {
    return getDBWizardSchema(
      dbClusters,
      hasImportStep,
      openApiValidationSchema
    );
  }, [
    dbClusters,
    hasImportStep,
    openApiValidationSchema,
  ]);

  return schema;
};

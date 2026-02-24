import { DbWizardFormFields2, MAX_DB_CLUSTER_NAME_LENGTH } from 'consts';
import { DbClusterName } from 'pages/database-form/database-form.types';
import { WizardMode } from 'shared-types/wizard.types';
import { z } from 'zod';
import { DbType } from '../../../../../../packages/types/src/db-type';
import { rfc_123_schema } from 'utils/common-validation';
import { Messages } from '../db-form.messages';
import { importStepSchema } from 'components/cluster-form/import/import-schema';

const basicInfoSchema = (dbClusters: DbClusterName[]) =>
  z
    .object({
      [DbWizardFormFields2.dbType]: z.nativeEnum(DbType),
      [DbWizardFormFields2.dbName]: rfc_123_schema({
        fieldName: 'database name',
      })
        .max(MAX_DB_CLUSTER_NAME_LENGTH, Messages.errors.dbName.tooLong)
        .nonempty(),
      [DbWizardFormFields2.k8sNamespace]: z.string().nullable(),
    })
    .passthrough()
    .superRefine(({ dbName, k8sNamespace }, ctx) => {
      const dbClustersNamesList = dbClusters.filter(
        (res) => res.namespace === k8sNamespace
      );

      if (dbClustersNamesList.find((item) => item.name === dbName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [DbWizardFormFields2.dbName],
          message: Messages.errors.dbName.duplicate,
        });
      }
    });

export const getDBWizardSchema = (
  activeStep: number,
  defaultValues: any, //TODO add type
  dbClusters: DbClusterName[],
  mode: WizardMode,
  hasImportStep: boolean,
  openApiValidationSchema?: z.ZodTypeAny
) => {
  const baseStepCount = hasImportStep ? 2 : 1;

  // Base steps use specific schemas, generated steps use the OpenAPI schema
  if (activeStep === 0) {
    return basicInfoSchema(dbClusters);
  }

  if (hasImportStep && activeStep === 1) {
    return importStepSchema;
  }

  // For all generated UI steps, use the OpenAPI validation schema
  if (activeStep >= baseStepCount && openApiValidationSchema) {
    return openApiValidationSchema;
  }

  // Fallback for any other case
  return z.object({}).passthrough();
};

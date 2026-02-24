import { z } from 'zod';
import { DbType } from '@percona/types';
import { MAX_DB_CLUSTER_NAME_LENGTH } from '../../consts.ts';
import { Messages } from './db-form.messages.ts';
import { DbWizardFormFields2 } from 'consts.ts';
import { rfc_123_schema } from 'utils/common-validation.ts';
import { dbVersionSchemaObject } from 'components/cluster-form/db-version/db-version-schema';
import { WizardMode } from 'shared-types/wizard.types.ts';
import { importStepSchema } from 'components/cluster-form/import/import-schema.tsx';

type DbClusterName = { name: string; namespace: string };

const basicInfoSchemaNew = (dbClusters: DbClusterName[]) =>
  z
    .object({
      [DbWizardFormFields2.dbType]: z.nativeEnum(DbType),
      [DbWizardFormFields2.dbName]: rfc_123_schema({
        fieldName: 'database name',
      })
        .max(MAX_DB_CLUSTER_NAME_LENGTH, Messages.errors.dbName.tooLong)
        .nonempty(),
      [DbWizardFormFields2.k8sNamespace]: z.string().nullable(),
      [DbWizardFormFields2.topology]: z.string(),
      ...dbVersionSchemaObject,
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

// Each position of the array is the validation schema for a given step
export const getDBWizardSchemaNew = (
  activeStep: number,
  _defaultValues: any, // TODO: Add proper type
  dbClusters: DbClusterName[],
  _mode: WizardMode, // TODO: Use mode for edit/restore validation
  hasImportStep: boolean
) => {
  const baseSchema = [
    basicInfoSchemaNew(dbClusters),
    ...(hasImportStep ? [importStepSchema] : []),
    // Generated steps will be added here dynamically based on zodSchema from useUiGenerator
  ];
  return baseSchema[activeStep];
};

export type ImportStepTypeNew = z.infer<typeof importStepSchema>;
export type BasicInfoTypeNew = z.infer<ReturnType<typeof basicInfoSchemaNew>>;

export type DbWizardTypeBaseNew = BasicInfoTypeNew;

export type DbWizardTypeWithImportPrestepNew = ImportStepTypeNew &
  DbWizardTypeBaseNew;

export type DbWizardTypeNew =
  | DbWizardTypeBaseNew
  | DbWizardTypeWithImportPrestepNew;

import { z } from 'zod';
import { DbType } from '@percona/types';
import { MAX_DB_CLUSTER_NAME_LENGTH } from '../../consts.ts';
import { Messages } from './database-form.messages.ts';
import { DbWizardFormFields } from 'consts.ts';
import { rfc_123_schema } from 'utils/common-validation.ts';
import { dbVersionSchemaObject } from 'components/cluster-form/db-version/db-version-schema';
import { DbClusterName } from './database-form.types.ts';
import { WizardMode } from 'shared-types/wizard.types.ts';
import { importStepSchema } from 'components/cluster-form/import/import-schema.tsx';

const basicInfoSchema = (dbClusters: DbClusterName[]) =>
  z
    .object({
      [DbWizardFormFields.dbType]: z.nativeEnum(DbType),
      [DbWizardFormFields.dbName]: rfc_123_schema({
        fieldName: 'database name',
      })
        .max(MAX_DB_CLUSTER_NAME_LENGTH, Messages.errors.dbName.tooLong)
        .nonempty(),
      [DbWizardFormFields.k8sNamespace]: z.string().nullable(),
      [DbWizardFormFields.topology]: z.string(),
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
          path: [DbWizardFormFields.dbName],
          message: Messages.errors.dbName.duplicate,
        });
      }
    });

// .passthrough tells Zod to not drop unrecognized keys
// this is needed because we parse step by step
// so, by default, Zod would leave behind the keys from previous steps

// const stepTwoSchema = (
//   defaultValues: Record<string, unknown>,
//   mode: WizardMode
// ) => resourcesFormSchema(defaultValues, mode === WizardMode.New, true, true);

// const backupsStepSchema = () =>
//   z
//     .object({
//       [DbWizardFormFields.schedules]: z.array(
//         z.object({
//           backupStorageName: z.string(),
//           enabled: z.boolean(),
//           name: z.string(),
//           schedule: z.string(),
//         })
//       ),
//       [DbWizardFormFields.pitrEnabled]: z.boolean(),
//       [DbWizardFormFields.pitrStorageLocation]: z
//         .string()
//         .or(
//           z.object({
//             name: z.string(),
//           })
//         )
//         .nullable()
//         .optional(),
//     })
//     .passthrough()
//     .superRefine(({ pitrEnabled, pitrStorageLocation }, ctx) => {
//       if (pitrEnabled && !pitrStorageLocation) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: [DbWizardFormFields.pitrStorageLocation],
//           message: ScheduleFormMessages.storageLocation.invalidOption,
//         });
//       }
//     });

// const stepFiveSchema = () =>
//   z
//     .object({
//       monitoring: z.boolean(),
//       monitoringInstance: z.string().nullable(),
//     })
//     .passthrough()
//     .superRefine(({ monitoring, monitoringInstance }, ctx) => {
//       if (monitoring && !monitoringInstance) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: [DbWizardFormFields.monitoringInstance],
//           message: Messages.errors.monitoringEndpoint.invalidOption,
//         });
//       }
//     });

// Each position of the array is the validation schema for a given step
export const getDBWizardSchema = (
  activeStep: number,
  defaultValues: DbWizardType,
  dbClusters: DbClusterName[],
  mode: WizardMode,
  hasImportStep: boolean,
  openApiValidationSchema?: z.ZodTypeAny
) => {
  const hardcodedSteps = [
    basicInfoSchema(dbClusters),
    ...(hasImportStep ? [importStepSchema] : []),
  ];

  if (activeStep < hardcodedSteps.length) {
    return hardcodedSteps[activeStep];
  }

  return openApiValidationSchema || z.object({}).passthrough();
};

export type ImportStepType = z.infer<typeof importStepSchema>;
export type BasicInfoType = z.infer<ReturnType<typeof basicInfoSchema>>;

// Base type includes hardcoded fields
export type DbWizardTypeBase = BasicInfoType & {
  [key: string]: unknown;
};

export type DbWizardTypeWithPrestep = ImportStepType & DbWizardTypeBase;

export type DbWizardType = DbWizardTypeBase | DbWizardTypeWithPrestep;

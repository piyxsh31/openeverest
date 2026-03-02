// everest
// Copyright (C) 2023 Percona LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useBlocker, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from 'react-hook-form';
import {
  useCreateDbCluster,
  useCreateDbClusterSecret,
} from 'hooks/api/db-cluster/useCreateDbCluster';
import { useActiveBreakpoint } from 'hooks/utils/useActiveBreakpoint';
import { DbWizardType } from './database-form-schema';
import DatabaseFormCancelDialog from './database-form-cancel-dialog/index';
import DatabaseFormBody from './database-form-body';
import DatabaseFormSideDrawer from './database-form-side-drawer';
import {
  DB_CLUSTERS_QUERY_KEY,
  useDBClustersForNamespaces,
  useNamespaces,
} from 'hooks';
import { WizardMode } from 'shared-types/wizard.types';
import { ZodType } from 'zod';
import { useDatabasePageDefaultValues } from './hooks/use-database-form-default-values';
import { useDatabasePageMode } from './hooks/use-database-page-mode';
import { DatabaseFormProvider } from './database-form-context';
import { useSchema } from './hooks/use-schema';
import { useUiGenerator } from 'components/ui-generator/hooks/ui-generator';
import { useDbValidationSchema } from './hooks/use-db-validation-schema';
import { ImportFields } from 'components/cluster-form/import/import.types';
import { DbWizardFormFields } from 'consts';

const flattenErrorPaths = (obj: Record<string, any>, prefix = ''): string[] => {
  if (!obj || typeof obj !== 'object') return prefix ? [prefix] : [];
  // A leaf RHF error node always has `message` or `type`
  if (obj.message !== undefined || obj.type !== undefined)
    return prefix ? [prefix] : [];
  return Object.keys(obj).flatMap((key) =>
    flattenErrorPaths(obj[key], prefix ? `${prefix}.${key}` : key)
  );
};

export const DatabasePage = () => {
  const latestDataRef = useRef<DbWizardType | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [longestAchievedStep, setLongestAchievedStep] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const { mutate: addDbCluster, isPending: isCreating } = useCreateDbCluster();
  const { mutate: addDbClusterSecret } = useCreateDbClusterSecret();
  const location = useLocation();
  const navigate = useNavigate();

  const { isDesktop } = useActiveBreakpoint();
  const mode = useDatabasePageMode();
  const queryClient = useQueryClient();

  const { uiSchema, topologies, hasMultipleTopologies } = useSchema();
  const defaultTopology = topologies[0] || '';

  const { defaultValues } = useDatabasePageDefaultValues(
    mode,
    uiSchema,
    defaultTopology
  );

  // Loading state - true if defaults are not yet ready
  const loadingClusterValues = !defaultValues;

  //TODO change to providers logic?
  const { data: namespaces = [] } = useNamespaces({
    refetchInterval: 10 * 1000,
  });
  const dbClustersResults = useDBClustersForNamespaces(
    namespaces.map((ns) => ({
      namespace: ns,
    }))
  );
  const dbClustersNamesList = useMemo(
    () =>
      Object.values(dbClustersResults)
        .map((item) => item.queryResult.data)
        .flat()
        .map((db) => ({
          name: db?.metadata?.name!,
          namespace: db?.metadata.namespace!,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(dbClustersResults)]
  );

  const hasImportStep = location.state?.showImport;

  const validationSchemaRef = useRef<ZodType<DbWizardType> | null>(null);

  const methods = useForm<DbWizardType>({
    mode: 'onChange',
    resolver: async (data, context, options) => {
      if (!validationSchemaRef.current) {
        return { values: data, errors: {} };
      }
      const customResolver = zodResolver(validationSchemaRef.current);
      const result = await customResolver(data, context, options);
      return result;
    },
    // @ts-ignore
    defaultValues,
  });

  const {
    reset,
    formState: { isDirty, errors },
    clearErrors,
    handleSubmit,
    trigger,
    control,
  } = methods;

  const selectedTopology = useWatch({
    control,
    name: 'topology',
  });

  const importOffset = hasImportStep ? 1 : 0;
  // dynamic sections start after step-0 (base) + optional import step
  const dynamicStepsStartIndex = 1 + importOffset;

  // Stable reference – avoids re-running useUiGenerator when uiSchema is falsy
  // TODO recheck rerender
  const stableUiSchema = useMemo(() => uiSchema || {}, [uiSchema]);

  const {
    sections,
    zodSchema: { schema: generatedZodSchema },
    sectionFieldStepMap,
  } = useUiGenerator(stableUiSchema, selectedTopology, dynamicStepsStartIndex);

  //TODO probably it will be cleaner to use steps.length or to
  // use Callback func (but in first scenario may be a problem of
  // last step cashing) and problem with submit/cancel
  const totalSteps = useMemo(
    () => 1 + (hasImportStep ? 1 : 0) + Object.keys(sections).length,
    [hasImportStep, sections]
  );

  // Get the validation schema for the current step
  const validationSchema = useDbValidationSchema(
    activeStep,
    defaultValues,
    dbClustersNamesList,
    mode,
    hasImportStep,
    generatedZodSchema
  ) as unknown as ZodType<DbWizardType>;

  useEffect(() => {
    validationSchemaRef.current = validationSchema;
    // Revalidate when schema changes
    trigger();
  }, [validationSchema, trigger]);

  //TODO refactor and move to separate hook
  const fieldToStepMap = useMemo(() => {
    const map: Record<string, number> = {
      // Step 0 – base step (always present)
      [DbWizardFormFields.dbName]: 0,
      [DbWizardFormFields.dbType]: 0,
      [DbWizardFormFields.k8sNamespace]: 0,
      [DbWizardFormFields.topology]: 0,
    };

    // Step 1 (optional) – import step
    if (hasImportStep) {
      (Object.values(ImportFields) as string[]).forEach((f) => {
        map[f] = 1;
      });
    }

    // Dynamic steps – comes pre-built from useUiGenerator
    Object.assign(map, sectionFieldStepMap);

    return map;
  }, [hasImportStep, sectionFieldStepMap]);

  const stepsWithErrors = useMemo(() => {
    const errorPaths = flattenErrorPaths(errors as Record<string, any>);
    const stepsSet = new Set<number>();

    errorPaths.forEach((path) => {
      // Try the full path first, then progressively shorter prefixes
      const parts = path.split('.');
      for (let i = parts.length; i > 0; i--) {
        const prefix = parts.slice(0, i).join('.');
        if (prefix in fieldToStepMap) {
          stepsSet.add(fieldToStepMap[prefix]);
          break;
        }
      }
    });

    return Array.from(stepsSet);
  }, [errors, fieldToStepMap]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !formSubmitted &&
      currentLocation.pathname !== nextLocation.pathname
  );

  const onSubmit: SubmitHandler<DbWizardType> = (data) => {
    latestDataRef.current = data;
    if (mode === WizardMode.New || mode === WizardMode.Restore) {
      const addCluster = () =>
        addDbCluster(
          {
            dbPayload: data,
            ...(mode === WizardMode.Restore && {
              backupDataSource: {
                dbClusterBackupName: location.state?.backupName,
                ...(location.state?.pointInTimeDate && {
                  pitr: {
                    date: location.state?.pointInTimeDate,
                    type: 'date',
                  },
                }),
              },
            }),
          },
          {
            onSuccess: (cluster) => {
              // We clear the query for the namespace to make sure the new cluster is fetched
              queryClient.removeQueries({
                queryKey: [DB_CLUSTERS_QUERY_KEY, cluster.metadata.namespace],
              });
              setFormSubmitted(true);
            },
          }
        );

      const credentials = latestDataRef.current?.credentials;
      if (hasImportStep && credentials && Object.keys(credentials).length > 0) {
        addDbClusterSecret(
          {
            dbClusterName: data.dbName,
            namespace: data.k8sNamespace || '',
            credentials: credentials as Record<string, string>,
          },
          {
            onSuccess: addCluster,
          }
        );
      } else {
        addCluster();
      }
    }
  };

  const handleNext = async () => {
    if (activeStep < totalSteps - 1) {
      setActiveStep((prevActiveStep) => {
        const newStep = prevActiveStep + 1;

        if (newStep > longestAchievedStep) {
          setLongestAchievedStep(newStep);
        }
        return newStep;
      });
    }
  };

  const handleBack = () => {
    clearErrors();
    if (activeStep > 0) {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleSectionEdit = (order: number) => {
    clearErrors();
    setActiveStep(order - 1);
  };

  const handleCloseCancellationModal = () => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const proceedNavigation = () => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  useEffect(() => {
    trigger();
  }, [activeStep, trigger]);

  useEffect(() => {
    // We disable the inputs on first step to make sure user doesn't change anything before all data is loaded
    // When users change the inputs, it means all data was loaded and we should't change the defaults anymore at this point
    // Because this effect relies on defaultValues, which comes from a hook that has dependencies that might be triggered somewhere else
    // E.g. If defaults depend on monitoringInstances query, step four will cause this to re-rerender, because that step calls that query again
    if (isDirty) {
      return;
    }

    if (mode === WizardMode.Restore) {
      reset(defaultValues);
    }
  }, [defaultValues, isDirty, reset, mode]);

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }
  }, []);

  useEffect(() => {
    if (formSubmitted) {
      navigate('/databases');
    }
  }, [formSubmitted, navigate]);

  if (!uiSchema) {
    //TODO check with noSchema in the api
    return;
  }

  //TODO move provider separately (clean code issue)
  return (
    <DatabaseFormProvider
      value={{
        uiSchema,
        topologies,
        hasMultipleTopologies,
        defaultTopology,
        sections,
      }}
    >
      <Stack direction={isDesktop ? 'row' : 'column'}>
        <FormProvider {...methods}>
          <DatabaseFormBody
            activeStep={activeStep}
            longestAchievedStep={longestAchievedStep}
            isSubmitting={isCreating}
            hasErrors={stepsWithErrors.length > 0}
            disableNext={
              hasImportStep && activeStep === 1 && stepsWithErrors.includes(1)
            }
            onSubmit={handleSubmit(onSubmit)}
            onCancel={() => navigate('/databases')}
            handleNextStep={handleNext}
            handlePreviousStep={handleBack}
          />
          <DatabaseFormSideDrawer
            disabled={loadingClusterValues}
            activeStep={activeStep}
            longestAchievedStep={longestAchievedStep}
            handleSectionEdit={handleSectionEdit}
            stepsWithErrors={stepsWithErrors}
          />
        </FormProvider>
      </Stack>
      <DatabaseFormCancelDialog
        open={blocker.state === 'blocked'}
        onClose={handleCloseCancellationModal}
        onConfirm={proceedNavigation}
      />
    </DatabaseFormProvider>
  );
};

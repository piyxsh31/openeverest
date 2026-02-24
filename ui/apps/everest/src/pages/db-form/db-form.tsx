import { useQueryClient } from '@tanstack/react-query';
import { useUiGenerator } from 'components/ui-generator/hooks/ui-generator';
import {
  useActiveBreakpoint,
  useCreateDbClusterNew,
  useDBClustersForNamespaces,
  useNamespaces,
  useSchema,
} from 'hooks';
import { useDatabasePageMode } from 'pages/database-form/useDatabasePageMode';
import { useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate } from 'react-router-dom';
import DatabaseFormSideDrawer from 'pages/database-form/database-form-side-drawer';
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from 'react-hook-form';
import { Stack, Step, StepLabel } from '@mui/material';
import DatabaseFormCancelDialog from 'pages/database-form/database-form-cancel-dialog';
import { Stepper } from '@percona/ui-lib';
import { useDBFormDefaultValues } from './hooks/use-db-form-default-values';
import { useDbValidationSchema } from './hooks/use-db-validation-schema';
import { ZodType } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSteps } from './hooks/use-steps';
import DBFormBody from './db-form-body';
import { WizardMode } from 'shared-types/wizard.types';

export const DatabasePageGenerated = () => {
  const latestDataRef = useRef<any | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [longestAchievedStep, setLongestAchievedStep] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [stepsWithErrors, setStepsWithErrors] = useState<number[]>([]);
  // TODO: Implement database creation logic
  const { mutate: _addDbCluster, isPending: isCreating } =
    useCreateDbClusterNew();
  // const { mutate: addDbClusterSecret } = useCreateDbClusterSecret();
  const location = useLocation();

  // Get schema and topology info from API hook
  const { schema, topologies } = useSchema();

  // Get default topology from schema
  const defaultTopology = topologies[0] || '';

  const navigate = useNavigate();
  const { isDesktop } = useActiveBreakpoint();
  const mode = useDatabasePageMode();
  // TODO: Will be used for invalidating queries after db creation
  const _queryClient = useQueryClient();

  // Create form with default values including topology
  const { defaultValues } = useDBFormDefaultValues(
    mode,
    schema,
    defaultTopology
  );

  const { data: namespaces = [] } = useNamespaces({
    refetchInterval: 10 * 1000,
  });
  const dbClustersResults = useDBClustersForNamespaces(
    namespaces.map((ns) => ({
      namespace: ns,
    }))
  );
  const dbClustersNamesList = Object.values(dbClustersResults)
    .map((item) => item.queryResult.data)
    .flat()
    .map((db) => ({
      name: db?.metadata?.name!,
      namespace: db?.metadata.namespace!,
    }));

  const hasImportStep = location.state?.showImport;

  // Initial validation schema (will be updated later with zodSchema)
  let validationSchemaRef = useRef<ZodType<any>>();

  const methods = useForm<any>({
    mode: 'onChange',
    resolver: async (data, context, options) => {
      // Use the latest validation schema
      if (!validationSchemaRef.current) {
        return { values: data, errors: {} };
      }

      const customResolver = zodResolver(validationSchemaRef.current);
      const result = await customResolver(data, context, options);

      if (Object.keys(result.errors).length > 0) {
        setStepsWithErrors((prev) => {
          if (!prev.includes(activeStep)) {
            return [...prev, activeStep];
          }
          return prev;
        });
      } else {
        setStepsWithErrors((prev) =>
          prev.filter((step) => step !== activeStep)
        );
      }
      return result;
    },
    // @ts-ignore
    defaultValues,
  });

  const {
    reset,
    formState: { isDirty },
    clearErrors,
    handleSubmit,
    trigger,
    control,
  } = methods;

  // Watch topology changes from the form
  const selectedTopology = useWatch({
    control,
    name: 'topology',
    defaultValue: defaultTopology,
  });

  // Generate sections and steps based on selected topology
  const {
    sections,
    zodSchema: { schema: zodSchema },
  } = useUiGenerator(schema, selectedTopology);

  const steps = useSteps(sections);

  const validationSchema = useDbValidationSchema(
    activeStep,
    defaultValues,
    dbClustersNamesList,
    mode,
    hasImportStep,
    zodSchema
  ) as unknown as ZodType<any>;

  // Update validation schema ref when it changes
  useEffect(() => {
    validationSchemaRef.current = validationSchema;
  }, [validationSchema]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !formSubmitted &&
      currentLocation.pathname !== nextLocation.pathname
  );

  const onSubmit: SubmitHandler<any> = (data: any) => {
    latestDataRef.current = data;
    if (mode === WizardMode.New || mode === WizardMode.Restore) {
      console.log('submit', data);
      // TODO: Implement database creation logic
      setFormSubmitted(true);
    }
  };

  const handleNext = async () => {
    if (activeStep < steps.length - 1) {
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

  return (
    <>
      <Stepper
        noConnector
        activeStep={activeStep}
        sx={{ marginBottom: 4 }}
        key={`stepper-${selectedTopology}`}
      >
        {steps.map((_, idx) => (
          <Step key={`${selectedTopology}-step-${idx + 1}`}>
            <StepLabel />
          </Step>
        ))}
      </Stepper>
      <Stack direction={isDesktop ? 'row' : 'column'}>
        <FormProvider {...methods}>
          <DBFormBody
            steps={steps}
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
            //TODO change when api is ready
            disabled={false}
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
    </>
  );
};

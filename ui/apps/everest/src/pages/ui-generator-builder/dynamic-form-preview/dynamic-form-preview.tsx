import { FormProvider, useForm } from 'react-hook-form';
import { UIGenerator } from 'components/ui-generator/ui-generator';
import { useState } from 'react';
import { SelectInput, Stepper } from '@percona/ui-lib';
import { getSteps } from 'components/ui-generator/utils/ui-generator.utils';
import { TopologyUISchemas } from 'components/ui-generator/ui-generator.types';
import { MenuItem, Stack, Step, StepLabel } from '@mui/material';
import { StepHeader } from 'pages/database-form/database-form-body/steps/step-header/step-header';
import DatabaseFormStepControllers from 'pages/database-form/database-form-body/DatabaseFormStepControllers';

export type DynamicFormProps = {
  schema: TopologyUISchemas;
};

export const DynamicForm = ({ schema }: DynamicFormProps) => {
  debugger;
  const [activeStep, setActiveStep] = useState(0);
  const topologies = Object.keys(schema);
  const [selectedTopology, setSelectedTopology] = useState<string>('');
  const sections = getSteps(selectedTopology, schema);
  const stepLabels = ['Choose topology', ...Object.keys(sections)];

  const methods = useForm({
    mode: 'onChange',
    // resolver: async (data, context, options) => {
    // //   const customResolver = zodResolver(schema);
    //   const result = await customResolver(data, context, options);
    //   return result;
    // },
    // defaultValues,
  });

  return (
    <FormProvider {...methods}>
      <Stepper noConnector activeStep={activeStep} sx={{ marginBottom: 4 }}>
        {stepLabels.map((_, idx) => (
          <Step key={`step-${idx + 1}`}>
            <StepLabel />
          </Step>
        ))}
      </Stepper>
      <Stack spacing={2} sx={{ marginTop: 2 }}>
        <StepHeader
          pageTitle={
            sections[stepLabels[activeStep]]?.name ??
            (stepLabels[activeStep] || '')
          }
          pageDescription={sections[stepLabels[activeStep]]?.description ?? ''}
        />
        {activeStep === 0 ? (
          <SelectInput name="topology.type" label="topology type">
            {topologies.map((topKey) => (
              <MenuItem
                value={topKey}
                key={topKey}
                onClick={() => setSelectedTopology(topKey)}
              >
                {topKey}
              </MenuItem>
            ))}
          </SelectInput>
        ) : (
          <UIGenerator
            activeStep={activeStep}
            sections={sections}
            stepLabels={stepLabels}
          />
        )}
      </Stack>
      <DatabaseFormStepControllers
        disableBack={activeStep === 0}
        disableSubmit={
          activeStep !== stepLabels.length - 1 ||
          Object.keys(methods.formState.errors).length > 0
        }
        showSubmit={activeStep === stepLabels.length - 1}
        onPreviousClick={() => setActiveStep((prev) => prev - 1)}
        onNextClick={() => setActiveStep((prev) => prev + 1)}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    </FormProvider>
  );
};

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

import React from 'react';
import { Box, Stack } from '@mui/material';
import { useDatabasePageMode } from 'pages/database-form/useDatabasePageMode';
import { useDatabasePageDefaultValues } from 'pages/database-form/useDatabaseFormDefaultValues';
import { DBFormBodyProps } from './types';
import DbFormStepControllers from './db-form-step-controllers';
import { WizardMode } from 'shared-types/wizard.types';
import { StepHeader } from 'pages/database-form/database-form-body/steps/step-header/step-header';
import { useSchema } from 'hooks';
import { useFormContext, useWatch } from 'react-hook-form';
import { useUiGenerator } from 'components/ui-generator/hooks/ui-generator';

const DBFormBody = ({
  steps,
  activeStep,
  longestAchievedStep,
  isSubmitting,
  hasErrors,
  disableNext,
  onCancel,
  onSubmit,
  handleNextStep,
  handlePreviousStep,
}: DBFormBodyProps) => {
  const mode = useDatabasePageMode();
  const { dbClusterRequestStatus, isFetching: loadingDefaultsForEdition } =
    useDatabasePageDefaultValues(mode);
  const { schema } = useSchema();
  const { control } = useFormContext();
  const selectedTopology = useWatch({ control, name: 'topology' });
  const { sections } = useUiGenerator(schema, selectedTopology);

  const isFirstStep = activeStep === 0;
  const currentStep = steps[activeStep];

  if (!currentStep) {
    return <Box>Invalid step</Box>;
  }

  const sectionKeys = Object.keys(sections);
  const stepLabel = currentStep.label;
  const sectionKey = sectionKeys.find(
    (key) => sections[key]?.label === stepLabel
  );
  const sectionInfo = sectionKey ? sections[sectionKey] : null;

  const isLastStep = activeStep === steps.length - 1;

  return (
    <form
      style={{ flexGrow: 1 }}
      onSubmit={(e) => {
        console.log(
          '[FORM] submit event fired. isLastStep:',
          isLastStep,
          'activeStep:',
          activeStep,
          'steps.length:',
          steps.length
        );
        console.trace('[FORM] submit call stack');
        if (!isLastStep) {
          e.preventDefault();
          e.stopPropagation();
          console.warn('[FORM] submit BLOCKED — not on last step');
          return;
        }
        console.log('[FORM] submit ALLOWED — on last step');
        onSubmit(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isLastStep) {
          console.log('[FORM] Enter key blocked on non-final step');
          e.preventDefault();
        }
      }}
    >
      <Stack spacing={2}>
        {activeStep > 0 && sectionInfo && (
          <StepHeader
            pageTitle={sectionInfo.label || stepLabel}
            pageDescription={sectionInfo.description || ''}
          />
        )}
        <Box>
          {(mode === WizardMode.New ||
            (mode === WizardMode.Restore &&
              dbClusterRequestStatus === 'success')) &&
            React.createElement(currentStep.component, {
              loadingDefaultsForEdition,
              alreadyVisited:
                longestAchievedStep > activeStep ||
                activeStep === steps.length - 1,
            })}
        </Box>
      </Stack>
      <DbFormStepControllers
        disableBack={isFirstStep}
        disableSubmit={isSubmitting || hasErrors}
        disableCancel={isSubmitting}
        disableNext={disableNext}
        showSubmit={isLastStep}
        onPreviousClick={handlePreviousStep}
        onNextClick={handleNextStep}
        onCancel={onCancel}
      />
    </form>
  );
};

export default DBFormBody;

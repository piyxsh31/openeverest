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
import { Box } from '@mui/material';
import { useDatabasePageMode } from 'pages/database-form/useDatabasePageMode';
import { useDatabasePageDefaultValues } from 'pages/database-form/useDatabaseFormDefaultValues';
import { DBFormBodyProps } from './types';
import DatabaseFormStepControllers from 'pages/database-form/database-form-body/DatabaseFormStepControllers';
import { WizardMode } from 'shared-types/wizard.types';

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

  const isFirstStep = activeStep === 0;
  const currentStep = steps[activeStep];

  if (!currentStep) {
    return <Box>Invalid step</Box>;
  }

  return (
    <form style={{ flexGrow: 1 }} onSubmit={onSubmit}>
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
      <DatabaseFormStepControllers
        disableBack={isFirstStep}
        disableSubmit={isSubmitting || hasErrors}
        disableCancel={isSubmitting}
        disableNext={disableNext}
        showSubmit={activeStep === steps.length - 1}
        onPreviousClick={handlePreviousStep}
        onNextClick={handleNextStep}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </form>
  );
};

export default DBFormBody;

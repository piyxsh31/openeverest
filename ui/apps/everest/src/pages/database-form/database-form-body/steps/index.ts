// everest
// Copyright (C) 2023 Percona LLC
// Copyright (C) 2026 The OpenEverest Contributors
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

import { BaseInfoStep } from './base-step/base-step.js';
import { useLocation } from 'react-router-dom';
import { ImportStep } from '../steps-old/import/import-step.js';
import { Section } from 'components/ui-generator/ui-generator.types.js';
import React, { useMemo } from 'react';
import { UIGenerator } from 'components/ui-generator/ui-generator.js';
import { StepInfo } from '../types.js';
import { Provider } from 'types/api.js';
import type { StepProps } from '../../database-form.types.js';

export const useSteps = (
  sections: { [key: string]: Section },
  sectionsOrder: string[] | undefined,
  providerObject?: Provider
) => {
  const location = useLocation();
  const showImportStep = location.state?.showImport;

  return useMemo(() => {
    const steps: StepInfo[] = [
      { component: BaseInfoStep, label: 'Basic Info' },
      ...(showImportStep ? [{ component: ImportStep, label: 'Import' }] : []),
    ];

    const sectionKeys = sectionsOrder || Object.keys(sections);

    sectionKeys.forEach((sectionKey, sectionIndex) => {
      const GeneratedStep = ({ loadingDefaultsForEdition }: StepProps) => {
        return React.createElement(UIGenerator, {
          activeStep: sectionIndex,
          sections,
          stepLabels: sectionKeys,
          providerObject,
          loadingDefaultsForEdition,
        });
      };

      steps.push({
        component: GeneratedStep,
        label: sections[sectionKey]?.label || sectionKey,
      });
    });

    return steps;
  }, [sections, sectionsOrder, showImportStep, providerObject]);
};

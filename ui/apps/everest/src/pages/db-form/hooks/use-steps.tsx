import { Section } from 'components/ui-generator/ui-generator.types';
import { ImportStep } from 'pages/database-form/database-form-body/steps/import/import-step';
import { useLocation } from 'react-router-dom';
import { BaseInfoStep } from '../db-form-body/steps/base-step/base-step';
import { UIGenerator } from 'components/ui-generator/ui-generator';
import { StepInfo } from '../db-form-body/types';

export const useSteps = (sections: { [key: string]: Section }): StepInfo[] => {
  const location = useLocation();
  const showImportStep = location.state?.showImport;

  const steps: StepInfo[] = [
    { component: BaseInfoStep, label: 'Basic Info' },
    ...(showImportStep ? [{ component: ImportStep, label: 'Import' }] : []),
  ];

  const sectionKeys = Object.keys(sections);

  // Generate steps from sections
  sectionKeys.forEach((sectionKey, index) => {
    const GeneratedStep = () => {
      return (
        <UIGenerator
          activeStep={index}
          sections={sections}
          stepLabels={sectionKeys}
        />
      );
    };

    steps.push({
      component: GeneratedStep,
      label: sections[sectionKey]?.label || sectionKey,
    });
  });

  return steps;
};

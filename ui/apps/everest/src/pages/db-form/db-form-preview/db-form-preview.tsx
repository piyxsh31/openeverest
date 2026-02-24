import React from 'react';
import { Stack, Typography } from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
import { DbFormPreviewProps } from './db-form-preview.types';
import { PreviewSection } from 'pages/database-form/database-preview/preview-section';
import { PreviewContentText } from 'pages/database-form/database-preview/preview-section';
import { DbFormBaseStepPreview } from './db-form-base-step-preview';
import { useSchema } from 'hooks';
import { useUiGenerator } from 'components/ui-generator/hooks/ui-generator';
import { useLocation } from 'react-router-dom';

// Helper function to get nested value from object using path string
const getValueByPath = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

// Generic preview component for dynamic sections
const DynamicSectionPreview = ({
  sectionComponents,
  formValues,
}: {
  sectionComponents: any;
  formValues: any;
}) => {
  if (!sectionComponents || typeof sectionComponents !== 'object') {
    return <PreviewContentText text="No data" />;
  }

  const renderComponent = (
    componentKey: string,
    component: any
  ): React.ReactNode => {
    if (!component) return null;

    // Handle groups
    if (component.uiType === 'group' && component.components) {
      return Object.keys(component.components).map((subKey) =>
        renderComponent(subKey, component.components[subKey])
      );
    }

    // Get value from form using the component's path
    const value = getValueByPath(formValues, component.path);

    if (value === null || value === undefined) return null;

    // Get label from fieldParams or use componentKey
    const label = component.fieldParams?.label || componentKey;

    // Handle different value types
    let displayValue: string = String(value);
    if (typeof value === 'boolean') {
      displayValue = value ? 'Enabled' : 'Disabled';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      displayValue = JSON.stringify(value);
    }

    return (
      <PreviewContentText
        key={component.path || componentKey}
        text={`${label}: ${displayValue}`}
      />
    );
  };

  return (
    <>
      {Object.keys(sectionComponents).map((componentKey) =>
        renderComponent(componentKey, sectionComponents[componentKey])
      )}
    </>
  );
};

export const DbFormPreview = ({
  activeStep,
  longestAchievedStep,
  onSectionEdit = () => {},
  disabled,
  stepsWithErrors,
  sx,
  ...stackProps
}: DbFormPreviewProps) => {
  const { getValues, control } = useFormContext();
  const location = useLocation();
  const showImportStep = location.state?.showImport;
  const { schema } = useSchema();
  const selectedTopology = useWatch({ control, name: 'topology' });
  const { sections } = useUiGenerator(schema, selectedTopology);

  // Under normal circumstances, useWatch should return the right values
  // But the initial setValue are not taking effect
  // So we just call useWatch to cause a re-render, and get the values from getValues
  useWatch();

  const values = getValues();

  // Build preview sections
  const previewSections = [
    { component: DbFormBaseStepPreview, title: 'Basic Information' },
    ...(showImportStep
      ? [
          {
            component: () => <PreviewContentText text="" />,
            title: 'Import information',
          },
        ]
      : []),
  ];

  // Add dynamic sections from ui-generator
  Object.keys(sections).forEach((sectionKey) => {
    const section = sections[sectionKey];
    previewSections.push({
      component: (values: any) => {
        return (
          <DynamicSectionPreview
            sectionComponents={section?.components}
            formValues={values}
          />
        );
      },
      title: section?.label || sectionKey,
    });
  });

  return (
    <Stack sx={{ pr: 2, pl: 2, ...sx }} {...stackProps}>
      <Typography variant="overline">Preview</Typography>
      <Stack>
        {previewSections.map((section, idx) => {
          const Section = section.component;
          const title = section.title;
          return (
            <React.Fragment key={`section-${idx + 1}`}>
              <PreviewSection
                order={idx + 1}
                title={title}
                hasBeenReached={longestAchievedStep >= idx}
                hasError={stepsWithErrors.includes(idx) && activeStep !== idx}
                active={activeStep === idx}
                disabled={disabled}
                onEditClick={() => onSectionEdit(idx + 1)}
                sx={{
                  mt: idx === 0 ? 2 : 0,
                }}
              >
                {/* @ts-ignore - Dynamic component with any props */}
                <Section {...values} />
              </PreviewSection>
            </React.Fragment>
          );
        })}
      </Stack>
    </Stack>
  );
};

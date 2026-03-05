import React from 'react';
import { Stack, Typography } from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { DatabasePreviewProps } from './database-preview.types.ts';
import { Messages } from './database.preview.messages.ts';
import { PreviewSection, PreviewContentText } from './preview-section.tsx';
import { DbWizardType } from '../database-form-schema.ts';
import { useDatabaseFormContext } from '../database-form-context.tsx';
import DynamicSectionPreview from './dynamic-section-preview/dynamic-section-preview.tsx';
import { PreviewSectionOne } from './sections/base-step.tsx';

export const DatabasePreview = ({
  activeStep,
  onSectionEdit = () => {},
  disabled,
  stepsWithErrors,
  sx,
  ...stackProps
}: DatabasePreviewProps) => {
  const { getValues } = useFormContext<DbWizardType>();
  const location = useLocation();
  const showImportStep = location.state?.showImport;
  const { sections, sectionsOrder } = useDatabaseFormContext();

  // Trigger a re-render when any form value changes so the preview stays in sync
  useWatch();

  const values = getValues();

  const orderedSectionKeys = sectionsOrder || Object.keys(sections);

  const previewSections: {
    title: string;
    component: React.ComponentType<DbWizardType>;
  }[] = [
    { title: 'Basic Information', component: PreviewSectionOne },
    ...(showImportStep
      ? [
          {
            title: 'Import information',
            component: () => <PreviewContentText text="" />,
          },
        ]
      : []),
    ...orderedSectionKeys.map((key) => ({
      title: sections[key]?.label || key,
      component: (v: DbWizardType) => (
        <DynamicSectionPreview section={sections[key]} formValues={v} />
      ),
    })),
  ];

  return (
    <Stack sx={{ pr: 2, pl: 2, ...sx }} {...stackProps}>
      <Typography variant="overline">{Messages.title}</Typography>
      <Stack>
        {previewSections.map((section, idx) => {
          const Section = section.component;
          return (
            <React.Fragment key={`section-${idx + 1}`}>
              <PreviewSection
                order={idx + 1}
                title={section.title}
                hasBeenReached
                hasError={stepsWithErrors.includes(idx) && activeStep !== idx}
                active={activeStep === idx}
                disabled={disabled}
                onEditClick={() => onSectionEdit(idx + 1)}
                sx={{ mt: idx === 0 ? 2 : 0 }}
              >
                <Section {...values} />
              </PreviewSection>
            </React.Fragment>
          );
        })}
      </Stack>
    </Stack>
  );
};

import React from 'react';
import { Stack, Typography } from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { beautifyDbTypeName } from '@percona/utils';
import { DatabasePreviewProps } from './database-preview.types';
import { Messages } from './database.preview.messages';
import { PreviewSection, PreviewContentText } from './preview-section';
import { DbWizardType } from '../database-form-schema.ts';
import { useDatabaseFormContext } from '../database-form-context';

const getValueByPath = (obj: any, path: string): any =>
  path.split('.').reduce((acc, part) => acc?.[part], obj);

//TODO refactore and move separately
const DynamicSectionPreview = ({
  sectionComponents,
  formValues,
}: {
  // TODO add typescript types
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

    if (component.uiType === 'group' && component.components) {
      return Object.keys(component.components).map((subKey) =>
        renderComponent(subKey, component.components[subKey])
      );
    }

    const value = getValueByPath(formValues, component.path);
    if (value === null || value === undefined) return null;

    const label = component.fieldParams?.label || componentKey;
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
      {Object.keys(sectionComponents).map((key) =>
        renderComponent(key, sectionComponents[key])
      )}
    </>
  );
};

// Preview for the fixed first step (basic database info)
const BaseStepPreview = (values: any) => {
  const { k8sNamespace, dbType, dbName, topology } = values;
  return (
    <>
      {k8sNamespace && (
        <PreviewContentText text={`Namespace: ${k8sNamespace}`} />
      )}
      {dbType && (
        <PreviewContentText text={`Type: ${beautifyDbTypeName(dbType)}`} />
      )}
      {dbName && <PreviewContentText text={`Name: ${dbName}`} />}
      {topology && <PreviewContentText text={`Topology: ${topology}`} />}
    </>
  );
};

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
  const { sections } = useDatabaseFormContext();

  // Trigger a re-render when any form value changes so the preview stays in sync
  useWatch();

  const values = getValues();

  // Build sections list dynamically from the ui-generator schema
  const previewSections: {
    title: string;
    component: (v: any) => React.ReactNode;
  }[] = [
    { title: 'Basic Information', component: BaseStepPreview },
    ...(showImportStep
      ? [
          {
            title: 'Import information',
            component: () => <PreviewContentText text="" />,
          },
        ]
      : []),
    ...Object.keys(sections).map((key) => ({
      title: sections[key]?.label || key,
      component: (v: any) => (
        <DynamicSectionPreview
          sectionComponents={sections[key]?.components}
          formValues={v}
        />
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
                // Always show all sections as reached so the preview is fully
                // visible from the very first step (no "greyed-out" locked steps)
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

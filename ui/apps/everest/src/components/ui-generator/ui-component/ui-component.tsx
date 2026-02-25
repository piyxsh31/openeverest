import {
  Component,
  FieldType,
} from 'components/ui-generator/ui-generator.types';
import React from 'react';
import { useFormContext, get } from 'react-hook-form';
import { InputAdornment } from '@mui/material';
import { muiComponentMap } from '../constants';
import { getMappedParams } from './get-mapped-params';
import { renderComponentChildren } from './utils/component-renderer';

type ComponentByType<T extends Component['uiType']> = Extract<
  Component,
  { uiType: T }
>;

export type ComponentProps<
  T extends Component['uiType'] = Component['uiType'],
> = {
  item: ComponentByType<T>;
  name: string;
};

const UIComponent: React.FC<ComponentProps> = ({ item, name }) => {
  const { uiType, fieldParams, validation } = item;
  const methods = useFormContext();
  const errors = methods?.formState?.errors || {};
  //get() is used to access nested error paths like "spec.replica.nodes"
  const errorObj = get(errors, name);
  const error = errorObj?.message as string | undefined;

  const MuiComponent = muiComponentMap[uiType];
  if (!MuiComponent) return null;

  const label = fieldParams?.label || '';

  const mappedProps = getMappedParams(uiType, fieldParams, validation);

  // Extract badge from mappedProps if present
  const { badge, textFieldProps, selectFieldProps, ...restMappedProps } =
    mappedProps as any;

  // Add badge as InputAdornment if present
  let finalTextFieldProps = textFieldProps;
  if (badge && uiType === FieldType.Number && textFieldProps) {
    // For Number fields (TextField-based), add InputProps with endAdornment
    finalTextFieldProps = {
      ...textFieldProps,
      InputProps: {
        ...textFieldProps.InputProps,
        endAdornment: <InputAdornment position="end">{badge}</InputAdornment>,
      },
    };
  }

  // For Select fields, badge handling different - needs to be in selectFieldProps
  let finalSelectFieldProps = selectFieldProps;
  if (badge && uiType === FieldType.Select && selectFieldProps) {
    finalSelectFieldProps = {
      ...selectFieldProps,
      endAdornment: <InputAdornment position="end">{badge}</InputAdornment>,
    };
  }

  const finalProps = {
    ...restMappedProps,
    ...(finalTextFieldProps ? { textFieldProps: finalTextFieldProps } : {}),
    ...(finalSelectFieldProps
      ? { selectFieldProps: finalSelectFieldProps }
      : {}),
  };

  // Render component-specific children (e.g., MenuItem options for Select)
  const children = renderComponentChildren(item, name);

  return (
    <>
      {React.createElement(
        MuiComponent,
        {
          ...finalProps,
          name,
          label,
          error: !!error,
          helperText: error,
          // Don't pass isRequired to prevent HTML required attribute
          // Validation is handled by Zod
          formControlProps: { sx: { minWidth: '450px', marginTop: '15px' } },
        },
        children
      )}
    </>
  );
};

export default UIComponent;

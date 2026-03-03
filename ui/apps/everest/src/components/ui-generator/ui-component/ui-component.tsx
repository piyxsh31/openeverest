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

import {
  Component,
  FieldType,
  SelectFieldParams,
} from 'components/ui-generator/ui-generator.types';
import React, { useMemo } from 'react';
import { useFormContext, get } from 'react-hook-form';
import { InputAdornment } from '@mui/material';
import { muiComponentMap } from '../constants';
import { getMappedParams } from './get-mapped-params';
import { renderComponentChildren } from './utils/component-renderer';
import { useUiGeneratorContext } from '../ui-generator-context';
import { getValueByPath } from './utils/select-component-handler';

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
  const { providerObject } = useUiGeneratorContext();

  //get() is used to access nested error paths like "spec.replica.nodes"
  const errorObj = get(errors, name);
  const error = errorObj?.message as string | undefined;

  const MuiComponent = muiComponentMap[uiType];
  if (!MuiComponent) return null;

  const label = fieldParams?.label || '';

  // For Select fields with optionsPath, resolve options from provider
  const resolvedFieldParams = useMemo(() => {
    if (uiType === FieldType.Select) {
      const selectParams = fieldParams as SelectFieldParams;

      if (
        'optionsPath' in selectParams &&
        selectParams.optionsPath &&
        providerObject
      ) {
        const { optionsPath, optionsPathConfig } = selectParams;
        const rawData = getValueByPath(providerObject, optionsPath);

        if (Array.isArray(rawData) && optionsPathConfig) {
          const { labelPath, valuePath } = optionsPathConfig;
          const options = rawData.map((item) => ({
            label: getValueByPath(item, labelPath) || '',
            value: getValueByPath(item, valuePath) || '',
          }));

          // Return new params object with resolved options
          return {
            ...selectParams,
            options,
            optionsPath: undefined,
            optionsPathConfig: undefined,
          } as SelectFieldParams;
        }
      }
    }
    return fieldParams;
  }, [uiType, fieldParams, providerObject]);

  const mappedProps = getMappedParams(uiType, resolvedFieldParams, validation);

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
  const children = renderComponentChildren(item, name, providerObject);

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
          formControlProps: { sx: { minWidth: '450px', marginTop: '15px' } },
        },
        children
      )}
    </>
  );
};

export default UIComponent;
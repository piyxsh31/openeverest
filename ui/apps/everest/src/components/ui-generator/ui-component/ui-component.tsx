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

import { Component } from 'components/ui-generator/ui-generator.types';
import React from 'react';
import { useFormContext, get } from 'react-hook-form';
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

  // Render component-specific children (e.g., MenuItem options for Select)
  const children = renderComponentChildren(item, name);

  return (
    <>
      {React.createElement(
        MuiComponent,
        {
          ...mappedProps,
          name,
          label,
          error: !!error,
          formControlProps: { sx: { minWidth: '450px', marginTop: '15px' } },
        },
        children
      )}
    </>
  );
};

export default UIComponent;

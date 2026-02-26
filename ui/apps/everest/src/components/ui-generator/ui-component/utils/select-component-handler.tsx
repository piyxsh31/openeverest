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

import { MenuItem } from '@mui/material';
import React from 'react';
import { FieldType, Component } from '../../ui-generator.types';

type SelectComponent = Extract<Component, { uiType: FieldType.Select }>;

export const isSelectComponent = (item: Component): item is SelectComponent => {
  return item.uiType === FieldType.Select;
};

export const shouldInjectEmptyOption = (item: Component): boolean => {
  if (!isSelectComponent(item)) return false;

  const isOptional = !item.validation?.required;
  const hasDisplayEmpty = !!item.fieldParams.displayEmpty;
  const hasEmptyOption = item.fieldParams.options.some(
    (opt) => opt.value === ''
  );

  return isOptional && hasDisplayEmpty && !hasEmptyOption;
};

export const renderSelectOptions = (
  item: Component,
  name: string
): React.ReactNode[] | undefined => {
  if (!isSelectComponent(item)) return undefined;

  const options: React.ReactNode[] = [];

  if (shouldInjectEmptyOption(item)) {
    options.push(
      <MenuItem key={`${name}-empty`} value="">
        None
      </MenuItem>
    );
  }

  item.fieldParams.options.forEach((option) => {
    options.push(
      <MenuItem key={`${name}-${option.value}`} value={option.value}>
        {option.label}
      </MenuItem>
    );
  });

  return options;
};

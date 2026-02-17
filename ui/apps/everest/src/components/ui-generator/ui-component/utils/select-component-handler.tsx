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

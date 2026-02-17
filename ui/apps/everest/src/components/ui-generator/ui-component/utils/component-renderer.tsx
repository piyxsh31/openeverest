import React from 'react';
import { Component, FieldType } from '../../ui-generator.types';
import { renderSelectOptions } from './select-component-handler';

export const renderComponentChildren = (
  item: Component,
  name: string
): React.ReactNode | undefined => {
  switch (item.uiType) {
    case FieldType.Select:
      return renderSelectOptions(item, name);

    case FieldType.Number:
    case FieldType.Hidden:
      return undefined;

    default:
      return undefined;
  }
};

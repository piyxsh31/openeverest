import { PreviewContentText } from '../preview-section';
import { orderComponents } from 'components/ui-generator/utils/component-renderer';
import {
  Component,
  ComponentGroup,
} from 'components/ui-generator/ui-generator.types';

const getValueByPath = (obj: unknown, path: string): unknown => {
  if (!obj || typeof obj !== 'object') return undefined;
  return path
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj
    );
};

//TODO describe types
export const renderComponent = (
  componentKey: string,
  component: Component | ComponentGroup,
  formValues: Record<string, unknown>,
  parentPrefix = ''
): React.ReactNode => {
  if (!component) return null;

  if (component.uiType === 'group' && 'components' in component) {
    return orderComponents(component.components, component.componentsOrder).map(
      ([subKey, subComp]) =>
        renderComponent(
          `${componentKey}.${subKey}`,
          subComp,
          formValues,
          parentPrefix ? `${parentPrefix}.${componentKey}` : componentKey
        )
    );
  }

  const leafComponent = component as Component;
  const value = leafComponent.path
    ? getValueByPath(formValues, leafComponent.path)
    : undefined;
  const label = leafComponent.fieldParams?.label || componentKey;

  let displayValue: string = '-';

  if (value === null || value === undefined) {
    displayValue = '-';
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Enabled' : 'Disabled';
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    displayValue = JSON.stringify(value);
  } else {
    displayValue = String(value);
  }

  const uniqueKey = `${parentPrefix || ''}:${leafComponent.path || componentKey}`;
  return (
    <PreviewContentText key={uniqueKey} text={`${label}: ${displayValue}`} />
  );
};

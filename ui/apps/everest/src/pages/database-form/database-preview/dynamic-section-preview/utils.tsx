import { PreviewContentText } from '../preview-section';
import { orderComponents } from 'components/ui-generator/utils/component-renderer';

const getValueByPath = (obj: any, path: string): any =>
  path.split('.').reduce((acc, part) => acc?.[part], obj);

//TODO describe types
export const renderComponent = (
  componentKey: string,
  component: any,
  formValues: any,
  parentPrefix = ''
): React.ReactNode => {
  if (!component) return null;

  if (component.uiType === 'group' && component.components) {
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

  const value = component.path
    ? getValueByPath(formValues, component.path)
    : undefined;

  const label = component.fieldParams?.label || componentKey;

  let displayValue: string = '-';

  if (value === null || value === undefined) {
    displayValue = '-';
  } else {
    displayValue = String(value);
  }
  if (typeof value === 'boolean') {
    displayValue = value ? 'Enabled' : 'Disabled';
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    displayValue = JSON.stringify(value);
  }

  const uniqueKey = `${parentPrefix || ''}:${component.path || componentKey}`;
  return (
    <PreviewContentText key={uniqueKey} text={`${label}: ${displayValue}`} />
  );
};

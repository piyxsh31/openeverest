import { PreviewContentText } from '../preview-section';
import { renderComponent } from './utils';
import { orderComponents } from 'components/ui-generator/utils/component-renderer';
import { Section } from 'components/ui-generator/ui-generator.types';

export const DynamicSectionPreview = ({
  section,
  formValues,
}: {
  section: Section;
  formValues: Record<string, unknown>;
}) => {
  const sectionComponents = section?.components;
  if (!sectionComponents || typeof sectionComponents !== 'object') {
    return <PreviewContentText text="No data" />;
  }

  return (
    <>
      {orderComponents(sectionComponents, section?.componentsOrder).map(
        ([key, comp]) =>
          renderComponent(
            key,
            comp,
            formValues,
            `${section?.label || ''}.${key}`
          )
      )}
    </>
  );
};

export default DynamicSectionPreview;

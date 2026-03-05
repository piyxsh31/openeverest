import { PreviewContentText } from '../preview-section';
import { renderComponent } from './utils';
import { orderComponents } from 'components/ui-generator/utils/component-renderer';

export const DynamicSectionPreview = ({
  section,
  formValues,
}: {
  // TODO add typescript types
  section: any;
  formValues: any;
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

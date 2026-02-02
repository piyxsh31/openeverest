import type { ReactNode } from 'react';
import type { Component, ComponentGroup } from '../ui-generator.types';
import { orderComponents } from './ui-generator.utils';
import UIComponent from '../ui-component/ui-component';
import UIGroup from '../ui-group/ui-group';

export const renderComponent = ({
  key,
  item,
  name,
  siblings = [],
}: {
  key: string;
  item: Component | ComponentGroup;
  name: string;
  siblings?: (Component | ComponentGroup)[];
}): ReactNode => {
  debugger;
  const fieldName = name;
  const isGroup = item?.uiType === 'group' && 'components' in item;

  const hasGroupSibling = siblings.some(
    (sib) => sib.uiType === 'group' && 'components' in sib
  );

  const nestingLevel = fieldName.split('.').length;
  debugger;
  const children = isGroup ? (
    orderComponents(
      (item as ComponentGroup).components,
      (item as ComponentGroup).componentsOrder
    ).map(([childKey, childItem]) => {
      debugger;
      const subSiblings = Object.values((item as ComponentGroup).components);
      console.log('subSiblings', subSiblings);
      return renderComponent({
        key: childKey,
        item: childItem,
        name: `${fieldName}.${childKey}`,
        siblings: subSiblings,
      });
    })
  ) : (
    <UIComponent item={item as Component} name={fieldName} />
  );

  if (isGroup) {
    return (
      <UIGroup
        key={key}
        item={item}
        groupType={(item as ComponentGroup).groupType}
        groupParams={(item as ComponentGroup).groupParams}
      >
        {children}
      </UIGroup>
    );
  }

  return <>{children}</>;
  //TODO in this place we can prepare a different type of wrapper, like accordion a
};

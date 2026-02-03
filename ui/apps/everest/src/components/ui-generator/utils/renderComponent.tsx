import type { ReactNode } from 'react';
import type {
  Component,
  ComponentGroup,
  Section,
  TopologyUISchemas,
} from '../ui-generator.types';
import UIComponent from '../ui-component/ui-component';
import UIGroup from '../ui-group/ui-group';

export const generateFieldId = (
  item: Component | ComponentGroup,
  generatedName: string
): string => {
  if ('path' in item && item.path && typeof item.path === 'string') {
    return item.path;
  }
  // to separate generated names from path-based names
  return `g-${generatedName}`;
};

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
  const fieldName = generateFieldId(item, name);
  console.log(
    `renderComponent: key=${key}, generatedName=${name}, finalFieldName=${fieldName}`
  );
  const isGroup = item?.uiType === 'group' && 'components' in item;

  // TODO can have different type of styles depenging on siblings and nesting level
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

export const getSteps = (
  selectedTopology: string,
  topologyUiSchemas: TopologyUISchemas
): { [key: string]: Section } => {
  return topologyUiSchemas[selectedTopology]?.sections || [];
};

export const orderComponents = (
  components: { [key: string]: Component | ComponentGroup },
  componentsOrder?: string[]
): [string, Component | ComponentGroup][] => {
  const entries = Object.entries(components);

  if (!componentsOrder || componentsOrder.length === 0) {
    return entries;
  }

  const componentMap = new Map(entries);
  const orderedEntries: [string, Component | ComponentGroup][] = [];
  const unorderedKeys = new Set(entries.map(([key]) => key));

  componentsOrder.forEach((key) => {
    if (componentMap.has(key)) {
      orderedEntries.push([key, componentMap.get(key)!]);
      unorderedKeys.delete(key);
    }
  });

  unorderedKeys.forEach((key) => {
    orderedEntries.push([key, componentMap.get(key)!]);
  });

  return orderedEntries;
};

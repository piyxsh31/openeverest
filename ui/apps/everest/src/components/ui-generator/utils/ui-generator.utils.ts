import {
  Component,
  ComponentGroup,
  Section,
  TopologyUISchemas,
} from '../ui-generator.types';

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

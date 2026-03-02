import type {
  Section,
  Component,
  ComponentGroup,
} from '../../ui-generator.types';

// TODO probably may be improved and be a part of some other function that walks throught
// all section
export const buildSectionFieldMap = (
  sections: { [key: string]: Section },
  startIndex: number
): Record<string, number> => {
  const map: Record<string, number> = {};

  const walkComponents = (
    components: { [key: string]: Component | ComponentGroup },
    stepIndex: number
  ) => {
    Object.values(components).forEach((comp) => {
      if (!comp) return;

      if (comp.uiType === 'group' || comp.uiType === 'hidden') {
        // Recurse into group children
        walkComponents((comp as ComponentGroup).components, stepIndex);
        return;
      }

      const leaf = comp as Component;
      if (leaf.path) {
        map[leaf.path] = stepIndex;
        // Register top-level segment as a fallback for partial-path matching
        const topLevel = leaf.path.split('.')[0];
        if (!(topLevel in map)) map[topLevel] = stepIndex;
      }
    });
  };

  Object.keys(sections).forEach((sectionKey, idx) => {
    const stepIndex = startIndex + idx;
    walkComponents(sections[sectionKey].components, stepIndex);
  });

  return map;
};

import type {
  Section,
  TopologyUISchemas,
} from 'components/ui-generator/ui-generator.types';

export const getSteps = (
  selectedTopology: string,
  topologyUiSchemas: TopologyUISchemas
): { sections: { [key: string]: Section }; sectionsOrder?: string[] } => {
  const topology = topologyUiSchemas[selectedTopology];
  return {
    sections: topology?.sections || {},
    sectionsOrder: topology?.sectionsOrder,
  };
};

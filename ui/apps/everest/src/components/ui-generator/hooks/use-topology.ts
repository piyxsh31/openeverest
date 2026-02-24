import { TopologyUISchemas } from 'components/ui-generator/ui-generator.types';
import { useState } from 'react';

export const useTopology = (
  schema: TopologyUISchemas
): {
  topologies: string[];
  hasMultipleTopologies: boolean;
  selectedTopology: string;
  setSelectedTopology: React.Dispatch<React.SetStateAction<string>>;
} => {
  const topologies = Object.keys(schema);
  const defaultTopology = topologies[0] || '';
  const hasMultipleTopologies = topologies.length > 1;
  const [selectedTopology, setSelectedTopology] =
    useState<string>(defaultTopology);

  return {
    topologies,
    hasMultipleTopologies,
    selectedTopology,
    setSelectedTopology,
  };
};

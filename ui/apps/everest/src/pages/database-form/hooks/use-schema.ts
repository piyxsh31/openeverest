import { TopologyUISchemas } from 'components/ui-generator/ui-generator.types';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Provider } from 'types/api';

export const useSchema = (): {
  uiSchema: TopologyUISchemas;
  topologies: string[];
  hasMultipleTopologies: boolean;
} => {
  const { state } = useLocation();
  const selectedDbProvider = state?.selectedDbProvider as Provider;
  selectedDbProvider?.spec?.uiSchema;

  const uiSchema = selectedDbProvider?.spec?.uiSchema || {};

  const topologies = useMemo(
    () => (uiSchema ? Object.keys(uiSchema) : []),
    [uiSchema]
  );

  const hasMultipleTopologies = useMemo(
    () => topologies.length > 1,
    [topologies.length]
  );

  return { uiSchema, topologies, hasMultipleTopologies };
};

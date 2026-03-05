import { TopologyUISchemas } from 'components/ui-generator/ui-generator.types';
import { preprocessSchema } from 'components/ui-generator/utils/preprocess-schema';
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

  const uiSchema = useMemo(
    () =>
      preprocessSchema(
        selectedDbProvider?.spec?.uiSchema || {},
        selectedDbProvider
      ),
    [selectedDbProvider]
  );

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

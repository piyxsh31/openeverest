import { TopologyUISchemas } from 'components/ui-generator/ui-generator.types';
import { useMemo } from 'react';
import { getDefaultValues } from '../utils/default-values';

export const useDefaultValues = (
  schema: TopologyUISchemas, //TODO check type
  selectedTopology: string
) => {
  const defaultValues: Record<string, unknown> = useMemo(() => {
    const values = getDefaultValues(schema, selectedTopology);
    return { topology: { type: selectedTopology }, ...values };
  }, [schema, selectedTopology]);

  return defaultValues;
};

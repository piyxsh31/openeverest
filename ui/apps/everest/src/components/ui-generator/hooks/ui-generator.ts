import { useMemo } from 'react';
import { z } from 'zod';
import { Section, TopologyUISchemas } from '../ui-generator.types';
import { getSteps } from '../utils/component-renderer';
import { buildZodSchema } from '../utils/schema-builder';

export const useUiGenerator = (
  schema: TopologyUISchemas,
  selectedTopology: string
): {
  sections: { [key: string]: Section };
  zodSchema: { schema: z.ZodTypeAny; celDependencyGroups: string[][] };
} => {
  const sections = useMemo(
    () => getSteps(selectedTopology, schema),
    [selectedTopology, schema]
  );

  const zodSchema = useMemo(
    () => buildZodSchema(schema, selectedTopology),
    [schema, selectedTopology]
  );

  return useMemo(
    () => ({
      sections,
      zodSchema,
    }),
    [sections, zodSchema]
  );
};

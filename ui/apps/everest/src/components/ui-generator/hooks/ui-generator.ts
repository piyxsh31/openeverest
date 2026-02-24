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
  const sections = getSteps(selectedTopology, schema);

  const zodSchema = buildZodSchema(schema, selectedTopology);

  return {
    sections,
    zodSchema,
  };
};

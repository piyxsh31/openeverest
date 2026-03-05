import { useMemo } from 'react';
import { z } from 'zod';
import { Section, TopologyUISchemas } from '../ui-generator.types';
import { getSteps, buildSectionFieldMap } from '../utils/component-renderer';
import { buildZodSchema } from '../utils/schema-builder';

export const useUiGenerator = (
  schema: TopologyUISchemas,
  selectedTopology: string,
  dynamicStepsStartIndex = 0
): {
  sections: { [key: string]: Section };
  sectionsOrder?: string[];
  zodSchema: { schema: z.ZodTypeAny; celDependencyGroups: string[][] };
  sectionFieldStepMap: Record<string, number>;
} => {
  const { sections, sectionsOrder } = useMemo(
    () => getSteps(selectedTopology, schema),
    [selectedTopology, schema]
  );

  const zodSchema = useMemo(
    () => buildZodSchema(schema, selectedTopology),
    [schema, selectedTopology]
  );

  const sectionFieldStepMap = useMemo(
    () => buildSectionFieldMap(sections, sectionsOrder, dynamicStepsStartIndex),
    [sections, sectionsOrder, dynamicStepsStartIndex]
  );

  return useMemo(
    () => ({
      sections,
      sectionsOrder,
      zodSchema,
      sectionFieldStepMap,
    }),
    [sections, sectionsOrder, zodSchema, sectionFieldStepMap]
  );
};

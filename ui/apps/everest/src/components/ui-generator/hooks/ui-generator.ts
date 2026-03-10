// Copyright (C) 2026 The OpenEverest Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

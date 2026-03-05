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

import {
  Component,
  ComponentGroup,
  FieldType,
  SelectFieldParams,
  TopologyUISchemas,
} from '../ui-generator.types';
import { Provider } from 'types/api';
import { resolveSelectOptions } from '../ui-component/utils/select-component-handler';

const preprocessComponent = (
  item: Component | ComponentGroup,
  providerObject: Provider
): Component | ComponentGroup => {
  if (
    (item.uiType === 'group' || item.uiType === 'hidden') &&
    'components' in item
  ) {
    return {
      ...item,
      components: preprocessComponents(
        (item as ComponentGroup).components,
        providerObject
      ),
    };
  }

  const component = item as Component;

  if (
    component.uiType === FieldType.Select &&
    'optionsPath' in component.fieldParams &&
    component.fieldParams.optionsPath
  ) {
    const options = resolveSelectOptions(component.fieldParams, providerObject);

    if (options.length === 0) {
      return item;
    }

    // Build params without the optionsPath fields (replaced by resolved static options)
    const rawFieldParams = component.fieldParams as Extract<
      SelectFieldParams,
      { optionsPath: string }
    >;
    const baseParams = (
      Object.keys(rawFieldParams) as (keyof typeof rawFieldParams)[]
    )
      .filter((k) => k !== 'optionsPath' && k !== 'optionsPathConfig')
      .reduce<Partial<SelectFieldParams>>(
        (acc, k) => ({ ...acc, [k]: rawFieldParams[k] }),
        {}
      ) as SelectFieldParams;

    // Only set defaultValue from resolved options if not already specified in schema
    const defaultValue =
      baseParams.defaultValue !== undefined
        ? baseParams.defaultValue
        : options[0].value;

    return {
      ...component,
      fieldParams: {
        ...baseParams,
        options,
        defaultValue,
      } as SelectFieldParams,
    };
  }

  return item;
};

const preprocessComponents = (
  components: { [key: string]: Component | ComponentGroup },
  providerObject: Provider
): { [key: string]: Component | ComponentGroup } => {
  return Object.fromEntries(
    Object.entries(components).map(([key, item]) => [
      key,
      preprocessComponent(item, providerObject),
    ])
  );
};

export const preprocessSchema = (
  schema: TopologyUISchemas,
  providerObject?: Provider
): TopologyUISchemas => {
  if (!providerObject) return schema;

  return Object.fromEntries(
    Object.entries(schema).map(([topologyKey, topology]) => {
      if (
        !topology ||
        typeof topology !== 'object' ||
        !('sections' in topology)
      ) {
        return [topologyKey, topology];
      }

      return [
        topologyKey,
        {
          ...topology,
          sections: Object.fromEntries(
            Object.entries(topology.sections).map(([sectionKey, section]) => [
              sectionKey,
              {
                ...section,
                components: preprocessComponents(
                  section.components,
                  providerObject
                ),
              },
            ])
          ),
        },
      ];
    })
  ) as TopologyUISchemas;
};

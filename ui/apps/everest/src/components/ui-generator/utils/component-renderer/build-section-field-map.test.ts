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

import { buildSectionFieldMap } from './build-section-field-map';
import { FieldType, Section } from '../../ui-generator.types';

const makeSections = (paths: string[]): { [key: string]: Section } => ({
  resources: {
    label: 'Resources',
    components: Object.fromEntries(
      paths.map((p, i) => [
        `field${i}`,
        {
          uiType: FieldType.Number,
          path: p,
          fieldParams: { label: `Field ${i}` },
        },
      ])
    ),
  },
});

describe('buildSectionFieldMap', () => {
  it('maps the leaf path to the correct step index', () => {
    const sections = makeSections(['spec.components.configServer.replicas']);
    const map = buildSectionFieldMap(sections, ['resources'], 2);

    expect(map['spec.components.configServer.replicas']).toBe(2);
  });

  it('registers ALL intermediate path prefixes for robust error-path lookup', () => {
    // This is the regression fix: when topology switches, Zod may report errors
    // at intermediate paths (e.g. spec.components.configServer) instead of the
    // leaf (spec.components.configServer.replicas) because the nested object is
    // undefined. All intermediate prefixes must map to the same step so that
    // stepsWithErrors always highlights the correct step.
    const sections = makeSections(['spec.components.configServer.replicas']);
    const map = buildSectionFieldMap(sections, ['resources'], 2);

    expect(map['spec']).toBe(2);
    expect(map['spec.components']).toBe(2);
    expect(map['spec.components.configServer']).toBe(2);
    expect(map['spec.components.configServer.replicas']).toBe(2);
  });

  it('does not override an intermediate prefix already registered by another field on a different step', () => {
    // "spec" is first registered by "spec.databaseVersion" on step 1.
    // Later fields on step 2 have paths inside "spec.components.*", but since
    // "spec" is already in the map it must NOT be overwritten.
    const sections: { [key: string]: Section } = {
      dbVersion: {
        label: 'DB Version',
        components: {
          ver: {
            uiType: FieldType.Text,
            path: 'spec.databaseVersion',
            fieldParams: { label: 'Version' },
          },
        },
      },
      resources: {
        label: 'Resources',
        components: {
          replicas: {
            uiType: FieldType.Number,
            path: 'spec.components.configServer.replicas',
            fieldParams: { label: 'Replicas' },
          },
        },
      },
    };

    const map = buildSectionFieldMap(
      sections,
      ['dbVersion', 'resources'],
      1 // start index
    );

    // spec.databaseVersion is on step 1 (startIndex 1 + sectionsOrder[0])
    expect(map['spec.databaseVersion']).toBe(1);
    // "spec" was first registered when processing "spec.databaseVersion" → step 1
    expect(map['spec']).toBe(1);
    // spec.components.configServer.replicas is on step 2
    expect(map['spec.components.configServer.replicas']).toBe(2);
    // intermediate paths for the replicas field that weren't yet registered:
    expect(map['spec.components']).toBe(2);
    expect(map['spec.components.configServer']).toBe(2);
  });

  it('handles top-level (no-dot) paths', () => {
    const sections = makeSections(['dbName']);
    const map = buildSectionFieldMap(sections, ['resources'], 0);

    expect(map['dbName']).toBe(0);
    // A single-segment path has no intermediate prefixes to register
    expect(Object.keys(map)).toEqual(['dbName']);
  });

  it('handles multiple fields in the same section', () => {
    const sections = makeSections([
      'spec.components.configServer.replicas',
      'spec.components.proxy.replicas',
      'spec.sharding.enabled',
    ]);
    const map = buildSectionFieldMap(sections, ['resources'], 3);

    expect(map['spec.components.configServer.replicas']).toBe(3);
    expect(map['spec.components.proxy.replicas']).toBe(3);
    expect(map['spec.sharding.enabled']).toBe(3);
    // Intermediate prefixes for the first field encountered win
    expect(map['spec']).toBe(3);
    expect(map['spec.components']).toBe(3);
    expect(map['spec.components.configServer']).toBe(3);
    expect(map['spec.components.proxy']).toBe(3);
    expect(map['spec.sharding']).toBe(3);
  });
});

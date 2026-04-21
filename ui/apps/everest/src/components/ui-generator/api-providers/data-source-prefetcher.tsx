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
import type {
  Component,
  ComponentGroup,
  DataSourceConfig,
  Section,
} from '../ui-generator.types';
import { hasDataSource } from './data-source-field';
import { useProviderOptions } from './registry';

type DataSourceDeclaration = {
  provider: string;
  config?: DataSourceConfig;
};

const collectDataSources = (
  sections: Record<string, Section>
): DataSourceDeclaration[] => {
  const results: DataSourceDeclaration[] = [];
  const seen = new Set<string>();

  const walk = (components: Record<string, Component | ComponentGroup>) => {
    for (const comp of Object.values(components)) {
      if ('components' in comp) {
        walk((comp as ComponentGroup).components);
      }
      const asComponent = comp as Component;
      if (hasDataSource(asComponent)) {
        if (!seen.has(asComponent.dataSource.provider)) {
          seen.add(asComponent.dataSource.provider);
          results.push({
            provider: asComponent.dataSource.provider,
            config: asComponent.dataSource.config,
          });
        }
      }
    }
  };

  for (const section of Object.values(sections)) {
    if (section.components) {
      walk(section.components);
    }
  }

  return results;
};

// Each data source gets its own component so hook rules are satisfied
const PrefetchItem = ({
  provider,
  namespace,
  cluster,
  config,
}: {
  provider: string;
  namespace: string;
  cluster: string;
  config?: DataSourceConfig;
}) => {
  useProviderOptions(provider, { namespace, cluster, config });
  return null;
};

type DataSourcePrefetcherProps = {
  sections: Record<string, Section>;
  namespace?: string;
  cluster?: string;
};

export const DataSourcePrefetcher = ({
  sections,
  namespace,
  cluster,
}: DataSourcePrefetcherProps) => {
  const dataSources = useMemo(() => collectDataSources(sections), [sections]);

  if (!namespace || !cluster) return null;

  // TODO: Support enable/disable toggle wrappers — when a component has
  // an on/off toggle (e.g. monitoring enabled/disabled), the prefetch
  // should only fire when the toggle is enabled. This will require
  // reading the toggle state from the form and conditionally including
  // the PrefetchItem.

  return (
    <>
      {dataSources.map((ds) => (
        <PrefetchItem
          key={ds.provider}
          provider={ds.provider}
          namespace={namespace}
          cluster={cluster}
          config={ds.config}
        />
      ))}
    </>
  );
};

// everest
// Copyright (C) 2023 Percona LLC
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

import { useQuery } from '@tanstack/react-query';
import { TopologyUISchemas } from 'components/ui-generator/ui-generator.types';
import { topologyUiSchemas } from 'components/ui-generator/ui-generator.mock';
import { PerconaQueryOptions } from 'shared-types/query.types';

export const SCHEMA_QUERY_KEY = 'schema';

// TODO: Replace with actual API call when backend is ready
const fetchSchema = async (): Promise<TopologyUISchemas> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(topologyUiSchemas);
    }, 0);
  });
};

export type UseSchemaResult = {
  schema: TopologyUISchemas;
  topologies: string[];
  hasMultipleTopologies: boolean;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Hook to fetch and manage UI schema with topology information
 * Currently returns mock data but designed to work with API in the future
 *
 * @param options - React Query options
 * @returns Schema data, topology information, loading state and error
 */
export const useSchema = (
  options?: PerconaQueryOptions<TopologyUISchemas>
): UseSchemaResult => {
  const {
    data: schema = {} as TopologyUISchemas,
    isLoading,
    error,
  } = useQuery<TopologyUISchemas, Error>({
    queryKey: [SCHEMA_QUERY_KEY],
    queryFn: fetchSchema,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  const topologies = Object.keys(schema);
  const hasMultipleTopologies = topologies.length > 1;

  return {
    schema,
    topologies,
    hasMultipleTopologies,
    isLoading,
    error,
  };
};

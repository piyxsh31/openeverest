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

import { DbType } from '@percona/types';
import { z } from 'zod';
import { Resources } from 'shared-types/dbCluster.types';
import { cpuParser, memoryParser } from 'utils/k8ResourceParser';
import { Messages } from './messages';
import { isVersion84x } from './utils';

const resourceToNumber = (minimum = 0) =>
  z.union([z.string().min(1), z.number()]).pipe(
    z.coerce
      .number({
        invalid_type_error: 'Please enter a valid number',
      })
      .min(minimum)
  );

export const matchFieldsValueToResourceSize = (
  sizes: Record<
    Exclude<ResourceSize, ResourceSize.custom>,
    Record<'cpu' | 'memory', number>
  >,
  resources?: Resources
): ResourceSize => {
  if (!resources) {
    return ResourceSize.custom;
  }
  const memory = memoryParser(resources.memory.toString(), 'G');
  const res = Object.values(sizes).findIndex((item) => {
    const sizeParsedMemory = memoryParser(item.memory.toString(), 'G');
    return (
      cpuParser(item.cpu.toString()) === cpuParser(resources.cpu.toString()) &&
      sizeParsedMemory.value === memory.value
    );
  });
  return res !== -1
    ? (Object.keys(sizes)[res] as ResourceSize)
    : ResourceSize.custom;
};

export const NODES_DB_TYPE_MAP: Record<DbType, string[]> = {
  [DbType.Mongo]: ['1', '3', '5'],
  [DbType.Mysql]: ['1', '3', '5'],
  [DbType.Postresql]: ['1', '2', '3'],
};

export enum ResourceSize {
  small = 'small',
  medium = 'medium',
  large = 'large',
  custom = 'custom',
}

export const humanizedResourceSizeMap: Record<ResourceSize, string> = {
  [ResourceSize.small]: 'Small',
  [ResourceSize.medium]: 'Medium',
  [ResourceSize.large]: 'Large',
  [ResourceSize.custom]: 'Custom',
};

export const NODES_DEFAULT_SIZES = (dbType: DbType, dbVersion: string = '') => {
  switch (dbType) {
    case DbType.Mysql:
      return {
        [ResourceSize.small]: {
          cpu: 1,
          memory: isVersion84x(dbVersion) ? 3 : 2,
          disk: 25,
        },
        [ResourceSize.medium]: {
          cpu: 4,
          memory: 8,
          disk: 100,
        },
        [ResourceSize.large]: {
          cpu: 8,
          memory: 32,
          disk: 200,
        },
      };
    case DbType.Mongo:
      return {
        [ResourceSize.small]: {
          cpu: 1,
          memory: 4,
          disk: 25,
        },
        [ResourceSize.medium]: {
          cpu: 4,
          memory: 8,
          disk: 100,
        },
        [ResourceSize.large]: {
          cpu: 8,
          memory: 32,
          disk: 200,
        },
      };
    case DbType.Postresql:
      return {
        [ResourceSize.small]: {
          cpu: 1,
          memory: 2,
          disk: 25,
        },
        [ResourceSize.medium]: {
          cpu: 4,
          memory: 8,
          disk: 100,
        },
        [ResourceSize.large]: {
          cpu: 8,
          memory: 32,
          disk: 200,
        },
      };
  }
};

export const PROXIES_DEFAULT_SIZES = {
  [DbType.Mysql]: {
    [ResourceSize.small]: {
      cpu: 0.2,
      memory: 0.2,
    },
    [ResourceSize.medium]: {
      cpu: 0.5,
      memory: 0.8,
    },
    [ResourceSize.large]: {
      cpu: 0.8,
      memory: 3,
    },
  },
  [DbType.Mongo]: {
    [ResourceSize.small]: {
      cpu: 1,
      memory: 2,
    },
    [ResourceSize.medium]: {
      cpu: 2,
      memory: 4,
    },
    [ResourceSize.large]: {
      cpu: 4,
      memory: 16,
    },
  },
  [DbType.Postresql]: {
    [ResourceSize.small]: {
      cpu: 1,
      memory: 0.03,
    },
    [ResourceSize.medium]: {
      cpu: 4,
      memory: 0.06,
    },
    [ResourceSize.large]: {
      cpu: 8,
      memory: 0.1,
    },
  },
};

export const DEFAULT_CONFIG_SERVERS = [1, 3, 5, 7];

export const MIN_NUMBER_OF_SHARDS = '1';

export const getDefaultNumberOfconfigServersByNumberOfNodes = (
  numberOfNodes: number
) => {
  if (DEFAULT_CONFIG_SERVERS.includes(numberOfNodes)) {
    return numberOfNodes;
  } else {
    return 7;
  }
};

const numberOfResourcesValidator = (
  numberOfResourcesStr: string,
  customNrOfResoucesStr: string,
  fieldPath: string,
  ctx: z.RefinementCtx
) => {
  if (numberOfResourcesStr === CUSTOM_NR_UNITS_INPUT_VALUE) {
    const intNr = parseInt(customNrOfResoucesStr, 10);

    if (Number.isNaN(intNr) || intNr < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid number',
        path: [fieldPath],
      });
    }
  }
};

export const resourcesFormSchema = (
  defaultValues: Record<string, unknown>,
  allowShardingDescaling: boolean,
  allowDescalingToOneNode: boolean,
  allowDiskDescaling: boolean
) => {
  const objectShape = {
    shardNr: z.string().optional(),
    shardConfigServers: z.number().optional(),
    cpu: resourceToNumber(0.6),
    memory: resourceToNumber(0.512),
    disk: resourceToNumber(1),
    // we will never input this, but we need it and zod will let it pass
    diskUnit: z.string(),
    resourceSizePerNode: z.nativeEnum(ResourceSize),
    numberOfNodes: z.string(),
    customNrOfNodes: z.string().optional(),
    proxyCpu: resourceToNumber(0),
    proxyMemory: resourceToNumber(0),
    resourceSizePerProxy: z.nativeEnum(ResourceSize),
    numberOfProxies: z.string(),
    customNrOfProxies: z.string().optional(),
  };

  const zObject = z.object(objectShape).passthrough();

  return zObject.superRefine(
    (
      {
        sharding,
        shardConfigServers,
        shardNr,
        numberOfNodes,
        numberOfProxies,
        customNrOfNodes = '',
        customNrOfProxies = '',
        dbType,
        disk,
      },
      ctx
    ) => {
      const areNodesCustom = numberOfNodes === CUSTOM_NR_UNITS_INPUT_VALUE;
      const areProxiesCustom = numberOfProxies === CUSTOM_NR_UNITS_INPUT_VALUE;
      const customNrOfNodesInt = parseInt(customNrOfNodes, 10);

      numberOfResourcesValidator(
        numberOfNodes,
        customNrOfNodes,
        'customNrOfNodes',
        ctx
      );

      if (dbType !== DbType.Mongo || (dbType === DbType.Mongo && !!sharding)) {
        numberOfResourcesValidator(
          numberOfProxies,
          customNrOfProxies,
          'customNrOfProxies',
          ctx
        );
      }

      if (
        areNodesCustom &&
        dbType === DbType.Mongo &&
        customNrOfNodesInt % 2 === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'The number of nodes cannot be even',
          path: ['customNrOfNodes'],
        });
      }

      const intNrNodes = areNodesCustom
        ? customNrOfNodesInt
        : parseInt(numberOfNodes, 10);

      if (dbType === DbType.Mysql) {
        const intNrProxies = parseInt(
          areProxiesCustom ? customNrOfProxies : numberOfProxies,
          10
        );

        if (intNrNodes > 1 && intNrProxies === 1) {
          if (areProxiesCustom) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Number of proxies must be more than 1',
              path: ['customNrOfProxies'],
            });
          } else {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Number of proxies must be more than 1',
              path: ['numberOfProxies'],
            });
          }
        }
      }

      if (!allowDescalingToOneNode) {
        const prevNumberOfNodes = defaultValues['numberOfNodes'] as string;

        const prevNumberOfNodesInt =
          prevNumberOfNodes === CUSTOM_NR_UNITS_INPUT_VALUE
            ? parseInt(defaultValues['customNrOfNodes'] as string, 10)
            : parseInt(prevNumberOfNodes, 10);

        if (intNrNodes === 1 && prevNumberOfNodesInt > 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Cannot scale down to one node.',
            path: ['numberOfNodes'],
          });
        }
      }

      if (sharding as boolean) {
        const intShardNr = parseInt(shardNr || '', 10);
        const intShardNrMin = +MIN_NUMBER_OF_SHARDS;
        const intShardConfigServers = shardConfigServers;

        if (Number.isNaN(intShardNr) || intShardNr < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: Messages.sharding.invalid,
            path: ['shardNr'],
          });
        } else {
          const previousSharding = defaultValues['shardNr'] as string;
          const intPreviousSharding = parseInt(previousSharding || '', 10);

          if (intShardNr < intShardNrMin) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: Messages.sharding.min(intShardNrMin),
              path: ['shardNr'],
            });
          }

          // TODO test the following:
          // If sharding is enabled, the number of shards cannot be decreased via edit
          if (!allowShardingDescaling && intShardNr < intPreviousSharding) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['shardNr'],
              message: Messages.descaling,
            });
          }
        }

        if (
          !Number.isNaN(numberOfNodes) &&
          numberOfNodes !== CUSTOM_NR_UNITS_INPUT_VALUE
        ) {
          if (intShardConfigServers === 1 && +numberOfNodes > 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: Messages.sharding.numberOfConfigServersError,
              path: ['shardConfigServers'],
            });
          }
        } else {
          if (!Number.isNaN(customNrOfNodes)) {
            if (intShardConfigServers === 1 && +customNrOfNodes > 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: Messages.sharding.numberOfConfigServersError,
                path: ['shardConfigServers'],
              });
            }
          }
        }
      }

      const prevDiskValue = defaultValues['disk'] as number;
      if (!allowDiskDescaling && disk < prevDiskValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: Messages.descaling,
          path: ['disk'],
        });
      }

      if (!Number.isInteger(disk)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: Messages.integerNumber,

          path: ['disk'],
        });
      }
    }
  );
};

export const CUSTOM_NR_UNITS_INPUT_VALUE = 'custom-units-nr';

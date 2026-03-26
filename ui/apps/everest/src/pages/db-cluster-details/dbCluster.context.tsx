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

import { useDbCluster } from 'hooks/api/db-cluster/useDbCluster';
import React, { createContext, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DbCluster, DbClusterStatus } from 'shared-types/dbCluster.types';
import { DbClusterContextProps } from './dbCluster.context.types';
import { useRBACPermissions } from 'hooks/rbac';
import { useState } from 'react';
import { QueryObserverResult, useQueryClient } from '@tanstack/react-query';
import { DB_CLUSTERS_QUERY_KEY } from 'hooks';
import { AxiosError } from 'axios';

export const DbClusterContext = createContext<DbClusterContextProps>({
  dbCluster: {} as DbCluster,
  isLoading: false,
  canReadBackups: false,
  canReadCredentials: false,
  canUpdateDb: false,
  clusterDeleted: false,
  temporarilyIncreaseInterval: () => {},
  queryResult: {} as QueryObserverResult<DbCluster, unknown>,
});

export const DbClusterContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { dbClusterName = '', namespace = '' } = useParams();
  const defaultInterval = 5 * 1000;
  const [refetchInterval, setRefetchInterval] = useState(defaultInterval);
  const [clusterDeleted, setClusterDeleted] = useState(false);
  const isDeleting = useRef(false);
  const queryClient = useQueryClient();
  const queryResult: QueryObserverResult<DbCluster, unknown> = useDbCluster(
    dbClusterName,
    namespace,
    {
      enabled: !!namespace && !!dbClusterName && !clusterDeleted,
      refetchInterval: refetchInterval,
    }
  );

  const { data: dbCluster, isLoading, error } = queryResult;

  const temporarilyIncreaseInterval = (
    interval: number,
    timeoutTime: number
  ) => {
    setRefetchInterval(interval);
    const timeout = setTimeout(() => {
      setRefetchInterval(defaultInterval);
      clearTimeout(timeout);
    }, timeoutTime);
  };

  const { canRead: canReadBackups } = useRBACPermissions(
    'database-cluster-backups',
    `${namespace}/${dbClusterName}`
  );
  const { canRead: canReadCredentials } = useRBACPermissions(
    'database-cluster-credentials',
    `${namespace}/${dbClusterName}`
  );
  const { canUpdate: canUpdateDb } = useRBACPermissions(
    'database-clusters',
    `${dbCluster?.metadata.namespace}/${dbCluster?.metadata.name}`
  );

  useEffect(() => {
    if (
      dbCluster?.status &&
      dbCluster?.status.status === DbClusterStatus.deleting
    ) {
      isDeleting.current = true;
    }

    if (isDeleting.current === true && error) {
      const axiosError = error as AxiosError;
      const errorStatus = axiosError.response ? axiosError.response.status : 0;
      setClusterDeleted(errorStatus === 404);
      queryClient.invalidateQueries({
        queryKey: [DB_CLUSTERS_QUERY_KEY, namespace],
      });
      queryClient.refetchQueries({
        queryKey: [DB_CLUSTERS_QUERY_KEY, namespace],
      });
    }
  }, [dbCluster?.status, error, namespace, queryClient]);

  return (
    <DbClusterContext.Provider
      value={{
        dbCluster,
        isLoading,
        canReadBackups,
        canUpdateDb,
        canReadCredentials,
        clusterDeleted,
        temporarilyIncreaseInterval,
        queryResult,
      }}
    >
      {children}
    </DbClusterContext.Provider>
  );
};

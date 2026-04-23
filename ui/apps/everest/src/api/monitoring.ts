import { api } from './api';
import {
  MonitoringConfig,
  MonitoringConfigCreateParams,
  MonitoringConfigList,
  MonitoringConfigUpdateParams,
} from 'shared-types/api.types';

export const getMonitoringConfigsFn = async (
  cluster: string,
  namespace: string
): Promise<MonitoringConfig[]> => {
  const response = await api.get<MonitoringConfigList>(
    `clusters/${cluster}/namespaces/${namespace}/monitoring-configs`
  );
  return response.data?.items ?? [];
};

export const createMonitoringConfigFn = async (
  cluster: string,
  namespace: string,
  payload: MonitoringConfigCreateParams
): Promise<MonitoringConfig> => {
  const response = await api.post<MonitoringConfig>(
    `clusters/${cluster}/namespaces/${namespace}/monitoring-configs`,
    payload
  );
  return response.data;
};

export const deleteMonitoringConfigFn = async (
  cluster: string,
  namespace: string,
  name: string
): Promise<void> => {
  await api.delete(
    `clusters/${cluster}/namespaces/${namespace}/monitoring-configs/${name}`
  );
};

export const updateMonitoringConfigFn = async (
  cluster: string,
  namespace: string,
  name: string,
  payload: MonitoringConfigUpdateParams
): Promise<MonitoringConfig> => {
  const response = await api.patch<MonitoringConfig>(
    `clusters/${cluster}/namespaces/${namespace}/monitoring-configs/${name}`,
    payload
  );
  return response.data;
};

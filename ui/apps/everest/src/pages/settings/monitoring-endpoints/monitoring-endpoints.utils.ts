import { MonitoringConfigForNamespaceResult } from 'hooks/api/monitoring/useMonitoringConfigsList';
import { MonitoringConfigTableElement } from './monitoring-endpoints.types';

export const convertMonitoringConfigsToTableFormat = (
  data: MonitoringConfigForNamespaceResult[]
): MonitoringConfigTableElement[] => {
  const result: MonitoringConfigTableElement[] = [];
  data.forEach((item) => {
    if (!item.queryResult.isSuccess) return;
    const rows = item.queryResult.data.map(
      (config): MonitoringConfigTableElement => ({
        name: config.metadata?.name ?? '',
        namespace: item.namespace,
        type: config.spec.type,
        url: config.spec.url,
        inUse: config.status?.inUse ?? false,
        pmmServerVersion: config.status?.pmmServerVersion ?? '-',
        raw: config,
      })
    );
    result.push(...rows);
  });
  return result;
};

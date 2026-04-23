import { MonitoringConfig } from 'shared-types/api.types';

export interface MonitoringConfigTableElement {
  name: string;
  namespace: string;
  type: string;
  url: string;
  inUse: boolean;
  pmmServerVersion: string;
  raw: MonitoringConfig;
}

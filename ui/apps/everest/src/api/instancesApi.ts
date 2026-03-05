import { CreateInstanceArgType } from 'types/api';
import { api } from './api';

export const createInstanceFn = async (
  clusterName: string,
  instanceName: string,
  providerName: string,
  namespace: string,
  data: CreateInstanceArgType['spec']
) => {
    const payload: CreateInstanceArgType = {
    apiVersion: 'core.openeverest.io/v1alpha1',
    kind: 'Instance',
    //TODO this TS error should gone after BE types updates
    metadata: { name: instanceName },
    spec: { provider: providerName, ...data },
  };
  const response = await api.post(
    `clusters/${clusterName}/namespaces/${namespace}/instances`,
    payload
  );

  return response.data;
};

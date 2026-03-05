import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { createInstanceFn } from 'api/instancesApi';
import { DbWizardType } from 'pages/database-form/database-form-schema';

type CreateInstanceHookArgType = {
  formValue: DbWizardType;
};

export const useCreateInstance = (
  options?: UseMutationOptions<
    DbWizardType,
    unknown,
    CreateInstanceHookArgType,
    unknown
  >
) =>
  useMutation({
    mutationFn: ({
      formValue: { provider, dbName, k8sNamespace, topology, ...rest },
    }: CreateInstanceHookArgType) => {
      //TODO check topology.config
      const spec = {
        topology: {
          ...topology,

          //TODO?
          // config?: formSpec?.topology?.config
        },
        ...rest,
      };
      return createInstanceFn(
        'main',
        dbName,
        provider,
        k8sNamespace || '',
        spec
      );
    },
    ...options,
  });

export default useCreateInstance;

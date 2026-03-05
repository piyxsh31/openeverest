import { useDefaultValues } from 'components/ui-generator/hooks/use-default-values';
import { TopologyUISchemas } from 'components/ui-generator/ui-generator.types';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { WizardMode } from 'shared-types/wizard.types';
import { getDbWizardDefaultValues } from '../utils/get-default-values';

export const useDatabasePageDefaultValues = (
  mode: WizardMode,
  uiSchema: TopologyUISchemas,
  defaultSelectedTopology: string
): {
  // TODO add typescript types
  defaultValues: Record<string, unknown>;
  dbClusterData: Record<string, unknown>;
  dbClusterRequestStatus: 'error' | 'idle' | 'pending' | 'success';
  isFetching: boolean;
} => {
  const { state } = useLocation();

  const defaultSchemaValues = useDefaultValues(
    uiSchema,
    defaultSelectedTopology
  );

  const defaultValues = useMemo(() => {
    const providerName =
      state?.selectedDbProvider?.metadata?.name || 'unknown-provider';
    if (mode === WizardMode.New) {
      const dbWizardDefaultValues = getDbWizardDefaultValues(providerName);
      // Add topology to default values
      return {
        ...defaultSchemaValues,
        ...dbWizardDefaultValues,
        topology: { type: defaultSelectedTopology },
      };
    } else {
      // TODO edit,restore,templates mode
      return {
        ...defaultSchemaValues,
        topology: { type: defaultSelectedTopology },
      };
      //   return dbClusterRequestStatus === 'success'
      //     ? DbClusterPayloadToFormValues(dbCluster, mode, namespace)
      //     : defaults;
    }
  }, [
    defaultSchemaValues,
    defaultSelectedTopology,
    mode,
    state?.selectedDbEngine,
  ]);

  // TODO edit,restore,templates mode
  //   useEffect(() => {
  //     // dbClusterRequestStatus === 'success' when the request is enabled, which only happens if shouldRetrieveDbClusterData === true
  //     // hence, no need to re-check mode and so on here
  //     if (dbClusterRequestStatus === 'success' && dbCluster) {
  //       setDefaultValues(
  //         DbClusterPayloadToFormValues(dbCluster, mode, namespace)
  //       );
  //     }
  //   }, [dbCluster, dbClusterRequestStatus, mode, namespace]);

  return {
    defaultValues,
    dbClusterData: {},
    // TODO change when api is ready
    dbClusterRequestStatus: 'success',
    // TODO change when api is ready
    isFetching: false,
  };
};

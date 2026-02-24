import { dbEngineToDbType } from '@percona/utils';
import { useDefaultValues } from 'components/ui-generator/hooks/use-default-values';
import { Topology } from 'components/ui-generator/ui-generator.types';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { WizardMode } from 'shared-types/wizard.types';
import { getDbWizardDefaultValues } from '../utils/get-default-values';

export const useDBFormDefaultValues = (
  mode: WizardMode,
  schema: Record<string, Topology>,
  selectedTopology: string
): {
  // TODO add types
  defaultValues: any;
  dbClusterData: any;
  dbClusterRequestStatus: 'error' | 'idle' | 'pending' | 'success';
  isFetching: boolean;
} => {
  const { state } = useLocation();
  //TODO more modes should be added when working on templates
  const shouldRetrieveDbClusterData =
    mode === WizardMode.Restore && !!state?.selectedDbCluster;
  const namespace = shouldRetrieveDbClusterData ? state?.namespace : null;
  // TODO for edit mode
  //   const {
  //     data: dbCluster,
  //     status: dbClusterRequestStatus,
  //     isFetching,
  //   } = useDbCluster(state?.selectedDbCluster, namespace, {
  //     enabled: shouldRetrieveDbClusterData,
  //   });

  const defaultSchemaValues = useDefaultValues(schema, selectedTopology);

  const defaultValues = useMemo(() => {
    const dbType = dbEngineToDbType(state?.selectedDbEngine);
    if (mode === WizardMode.New) {
      const dbWizardDefaultValues = getDbWizardDefaultValues(dbType);
      // Add topology to default values
      return {
        ...defaultSchemaValues,
        ...dbWizardDefaultValues,
        topology: selectedTopology,
      };
    } else {
      // TODO edit,restore,templates mode
      return { ...defaultSchemaValues, topology: selectedTopology };
      //   return dbClusterRequestStatus === 'success'
      //     ? DbClusterPayloadToFormValues(dbCluster, mode, namespace)
      //     : defaults;
    }
  }, [defaultSchemaValues, selectedTopology, mode, state?.selectedDbEngine]);

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

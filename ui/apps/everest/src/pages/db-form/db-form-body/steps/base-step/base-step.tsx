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

import { FormGroup, MenuItem } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { DbType } from '@percona/types';
import { AutoCompleteInput, SelectInput, TextInput } from '@percona/ui-lib';
import { dbTypeToDbEngine } from '@percona/utils';
import { useFormContext } from 'react-hook-form';
import { DbWizardFormFields2 } from 'consts.ts';
import { useNamespacePermissionsForResource } from 'hooks/rbac';
import { useDBEnginesForDbEngineTypes, useSchema } from 'hooks/index.ts';
import { WizardMode } from 'shared-types/wizard.types.ts';
import { Messages } from 'pages/database-form/database-form-body/steps/first/first-step.messages.ts';
import { useDatabasePageMode } from 'pages/db-form/hooks/use-db-page-mode.ts';
import { StepProps } from 'pages/database-form/database-form.types';
import { StepHeader } from 'pages/database-form/database-form-body/steps/step-header/step-header.tsx';

export const BaseInfoStep = ({ loadingDefaultsForEdition }: StepProps) => {
  const mode = useDatabasePageMode();

  const { watch, setValue, getFieldState } = useFormContext();

  // Get topology information from schema
  const { topologies, hasMultipleTopologies } = useSchema();

  const dbType: DbType = watch(DbWizardFormFields2.dbType);
  const dbNamespace = watch(DbWizardFormFields2.k8sNamespace);
  const currentTopology = watch(DbWizardFormFields2.topology);

  const [dbEnginesFoDbEngineTypes, dbEnginesFoDbEngineTypesFetching] =
    useDBEnginesForDbEngineTypes(dbTypeToDbEngine(dbType));

  const dbEnginesDataWithNamespaces = useMemo(() => {
    return !dbEnginesFoDbEngineTypesFetching
      ? dbEnginesFoDbEngineTypes.map((item) => item?.dbEngines).flat(1)
      : [];
  }, [dbEnginesFoDbEngineTypesFetching, dbEnginesFoDbEngineTypes]);

  const dbEngineData = useMemo(() => {
    const dbEnginesArray = dbEnginesDataWithNamespaces
      .filter((item) => item.namespace === dbNamespace)
      .map((item) => item.dbEngine);
    const dbEngine = dbEnginesArray ? dbEnginesArray[0] : undefined;
    if (mode !== WizardMode.New && dbEngine) {
      //   const validVersions = filterAvailableDbVersionsForDbEngineEdition(
      //     dbEngine,
      //     defaultDbVersion,
      //     mode
      //   );
      return {
        ...dbEngine,
        availableVersions: {
          ...dbEngine.availableVersions,
          //   engine: validVersions,
        },
      };
    }
    return dbEngine;
  }, [dbEnginesDataWithNamespaces, dbNamespace, mode]);

  const { canCreate, isLoading } =
    useNamespacePermissionsForResource('database-clusters');

  const filteredNamespaces = canCreate.filter((namespace) =>
    dbEnginesDataWithNamespaces?.find(
      (dbEngine) => dbEngine.namespace === namespace
    )
  );

  // setting the dbnamespace default value
  useEffect(() => {
    const { isTouched: k8sNamespaceTouched } = getFieldState(
      DbWizardFormFields2.k8sNamespace
    );
    if (
      !k8sNamespaceTouched &&
      mode === WizardMode.New &&
      filteredNamespaces.length > 0 &&
      !isLoading
    ) {
      setValue(DbWizardFormFields2.k8sNamespace, filteredNamespaces[0], {
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isLoading, filteredNamespaces.length]);

  // setting the topology default value
  useEffect(() => {
    const { isTouched: topologyTouched } = getFieldState(
      DbWizardFormFields2.topology
    );
    if (
      !topologyTouched &&
      mode === WizardMode.New &&
      topologies.length > 0 &&
      !currentTopology
    ) {
      setValue(DbWizardFormFields2.topology, topologies[0], {
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, topologies.length, currentTopology]);

  // setting the dvVersion default value
  useEffect(() => {
    // Safety check
    if (!dbEngineData || !dbEngineData.availableVersions.engine.length) {
      return;
    }
  }, [dbEngineData, getFieldState, mode, setValue]);

  //   const onNamespaceChange = () => {
  //     //TODO how to describe in the schema
  //     const defaults = getDbWizardDefaultValues(dbType);
  //     setValue(
  //       DbWizardFormFields.monitoringInstance,
  //       defaults.monitoringInstance
  //     );
  //     setValue(DbWizardFormFields.monitoring, defaults.monitoring);
  //     setValue(
  //       DbWizardFormFields.monitoringInstance,
  //       defaults.monitoringInstance
  //     );
  //     setValue(DbWizardFormFields.schedules, []);
  //     setValue(DbWizardFormFields.pitrEnabled, false);
  //   };

  return (
    <>
      <StepHeader
        pageTitle={'Basic Information'}
        pageDescription={Messages.pageDescription}
      />
      <FormGroup sx={{ mt: 3 }}>
        <AutoCompleteInput
          labelProps={{
            sx: { mt: 1 },
          }}
          name={DbWizardFormFields2.k8sNamespace}
          label={Messages.labels.k8sNamespace}
          loading={isLoading}
          options={filteredNamespaces}
          disabled={mode === WizardMode.Restore || loadingDefaultsForEdition}
          //   onChange={onNamespaceChange}
          autoCompleteProps={{
            disableClearable: true,
            isOptionEqualToValue: (option, value) => option === value,
          }}
        />
        <TextInput
          name={DbWizardFormFields2.dbName}
          label={Messages.labels.dbName}
          textFieldProps={{
            placeholder: Messages.placeholders.dbName,
            disabled: loadingDefaultsForEdition,
          }}
        />
        {hasMultipleTopologies && (
          <SelectInput
            name={DbWizardFormFields2.topology}
            label="Database Topology"
            selectFieldProps={{
              disabled: loadingDefaultsForEdition,
            }}
          >
            {topologies.map((topology) => (
              <MenuItem key={topology} value={topology}>
                {topology}
              </MenuItem>
            ))}
          </SelectInput>
        )}
      </FormGroup>
    </>
  );
};

export default BaseInfoStep;

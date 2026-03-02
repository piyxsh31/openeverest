import { DbType } from '@percona/types';
import { useFormContext } from 'react-hook-form';
import { DbWizardFormFields } from 'consts';
import { useDatabasePageMode } from '../../../hooks/use-database-page-mode.js';
import { StepHeader } from '../step-header/step-header.js';
import { Messages } from './resources-step.messages.js';
import { ResourcesForm } from 'components/cluster-form';
import { WizardMode } from 'shared-types/wizard.types.ts';

export const ResourcesStep = () => {
  const { watch } = useFormContext();
  const mode = useDatabasePageMode();
  const dbType: DbType = watch(DbWizardFormFields.dbType);
  const shardingEnabled = watch(DbWizardFormFields.sharding);

  return (
    <>
      <StepHeader
        pageTitle={Messages.pageTitle}
        pageDescription={Messages.pageDescription}
      />
      <ResourcesForm
        dbType={dbType}
        pairProxiesWithNodes={mode === WizardMode.New}
        allowDiskInputUpdate
        showSharding={dbType === DbType.Mongo}
        hideProxies={dbType === DbType.Mongo && !shardingEnabled}
        disableShardingInput={mode === WizardMode.Restore}
      />
    </>
  );
};

import { DbType } from '@percona/types';
import { DbWizardFormFields2 } from 'consts';
import { generateShortUID } from 'utils/generateShortUID';

// TODO add typescript types
export const getDbWizardDefaultValues = (dbType: DbType): any => ({
  [DbWizardFormFields2.dbType]: dbType,
  [DbWizardFormFields2.dbName]: `${dbType}-${generateShortUID()}`,
  [DbWizardFormFields2.k8sNamespace]: null,
});

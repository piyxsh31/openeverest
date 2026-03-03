import { DbType } from '@percona/types';
import { DbWizardFormFields } from 'consts';
import { generateShortUID } from 'utils/generateShortUID';
// TODO add typescript types
export const getDbWizardDefaultValues = (dbType: DbType): any => ({
  [DbWizardFormFields.dbType]: dbType,
  [DbWizardFormFields.dbName]: `${dbType}-${generateShortUID()}`,
  [DbWizardFormFields.k8sNamespace]: null,
});

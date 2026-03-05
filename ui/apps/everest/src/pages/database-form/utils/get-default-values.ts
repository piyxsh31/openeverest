import { DbWizardFormFields } from 'consts';
import { generateShortUID } from 'utils/generateShortUID';
// TODO add typescript types
export const getDbWizardDefaultValues = (
  providerName: string
): Record<string, unknown> => ({
  [DbWizardFormFields.provider]: providerName,
  [DbWizardFormFields.dbName]: `inst-${generateShortUID()}`,
  [DbWizardFormFields.k8sNamespace]: null,
});

import { beautifyDbTypeName } from '@percona/utils';
import { PreviewContentText } from 'pages/database-form/database-preview/preview-section';
import { DbWizardFormFields2 } from 'consts';

// Custom preview component for db-form base step
export const DbFormBaseStepPreview = (values: any) => {
  const dbName = values[DbWizardFormFields2.dbName];
  const k8sNamespace = values[DbWizardFormFields2.k8sNamespace];
  const dbType = values[DbWizardFormFields2.dbType];
  const topology = values[DbWizardFormFields2.topology];

  return (
    <>
      {k8sNamespace && (
        <PreviewContentText text={`Namespace: ${k8sNamespace}`} />
      )}
      {dbType && (
        <PreviewContentText text={`Type: ${beautifyDbTypeName(dbType)}`} />
      )}
      {dbName && <PreviewContentText text={`Name: ${dbName}`} />}
      {topology && <PreviewContentText text={`Topology: ${topology}`} />}
    </>
  );
};

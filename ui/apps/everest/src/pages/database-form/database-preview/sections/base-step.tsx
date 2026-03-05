import { PreviewContentText } from '../preview-section';
import { SectionProps } from './section.types';

export const PreviewSectionOne = ({
  dbName,
  topology,
  provider,
  k8sNamespace,
}: SectionProps) => (
  <>
    {k8sNamespace && <PreviewContentText text={`Namespace: ${k8sNamespace}`} />}
    {provider && <PreviewContentText text={`Provider: ${provider}`} />}
    {dbName && <PreviewContentText text={`Name: ${dbName}`} />}
    {topology && topology?.type && (
      <PreviewContentText text={`Topology: ${topology?.type}`} />
    )}
  </>
);

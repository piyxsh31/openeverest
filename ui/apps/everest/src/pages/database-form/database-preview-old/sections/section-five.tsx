import { PreviewContentText } from '../../database-preview/preview-section';
import { SectionProps } from '../../database-preview/sections/section.types';

export const PreviewSectionFive = ({ monitoring }: SectionProps) => (
  <PreviewContentText text={monitoring ? 'Enabled' : 'Disabled'} />
);

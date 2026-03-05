import { PreviewSectionFive } from './section-five.js';
import { BackupsPreviewSection } from './backups-section.js';
import { AdvancedConfigurationsPreviewSection } from './advanced-configurations-section.js';
import { PreviewSectionOne } from '../../database-preview/sections/base-step.js';
import { ResourcesPreviewSection } from './resources-section.js';
import { useLocation } from 'react-router-dom';
import { PreviewContentText } from '../../database-preview/preview-section.js';

export const usePreviewSections = () => {
  const location = useLocation();
  const showImportStep = location.state?.showImport;
  return [
    { component: PreviewSectionOne, title: 'Basic Information' },
    ...(showImportStep
      ? [
          {
            component: () => PreviewContentText({ text: '' }),
            title: 'Import information',
          },
        ]
      : []),
    { component: ResourcesPreviewSection, title: 'Resources' },
    { component: BackupsPreviewSection, title: 'Backups' },
    {
      component: AdvancedConfigurationsPreviewSection,
      title: 'Advanced Configurations',
    },
    { component: PreviewSectionFive, title: 'Monitoring' },
  ];
};

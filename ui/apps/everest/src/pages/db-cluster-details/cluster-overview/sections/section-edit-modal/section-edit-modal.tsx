// Copyright (C) 2026 The OpenEverest Contributors
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

import { useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { FormDialog } from 'components/form-dialog/form-dialog';
import { UIGenerator } from 'components/ui-generator/ui-generator';
import {
  FormMode,
  TopologyUISchemas,
} from 'components/ui-generator/ui-generator.types';
import { buildSectionZodSchema } from 'components/ui-generator/utils/schema-builder';
import { extractInstanceValues } from 'components/ui-generator/utils/default-values/extract-instance-values';
import { applyModeOverrides } from 'components/ui-generator/utils/preprocess/apply-mode-overrides';
import { postprocessSchemaData } from 'components/ui-generator/utils/postprocess/postprocess-schema';
import { deepClone } from 'components/ui-generator/utils/object-path/object-path';
import { useUpdateDbInstanceWithConflictRetry } from 'hooks/api/db-instances/useUpdateDbInstance';
import type { Instance } from 'types/api';
import type { SectionEditModalProps } from './section-edit-modal.types';

const SectionEditModal = ({
  sectionKey,
  sections,
  instance,
  provider,
  onClose,
  onSuccess,
}: SectionEditModalProps) => {
  const [submitting, setSubmitting] = useState(false);

  const editSections = useMemo(
    () => applyModeOverrides(sections, FormMode.Edit),
    [sections]
  );

  const section = editSections[sectionKey];

  const { schema: zodSchema } = useMemo(
    () =>
      buildSectionZodSchema(sectionKey, editSections, {
        formMode: FormMode.Edit,
        originalData: instance as unknown as Record<string, unknown>,
      }),
    [sectionKey, editSections, instance]
  );

  const defaultValues = useMemo(
    () =>
      extractInstanceValues(
        editSections,
        instance as unknown as Record<string, unknown>
      ),
    [editSections, instance]
  );

  const { mutate } = useUpdateDbInstanceWithConflictRetry(instance, {
    onSuccess: () => {
      setSubmitting(false);
      enqueueSnackbar('Section updated successfully', { variant: 'success' });
      onSuccess();
      onClose();
    },
    onError: () => {
      setSubmitting(false);
    },
  });

  const handleSubmit = (formData: Record<string, unknown>) => {
    setSubmitting(true);

    const topologyType = instance?.spec?.topology?.type;
    const uiSchema = provider?.spec?.uiSchema as TopologyUISchemas | undefined;

    const processed = postprocessSchemaData(formData, {
      schema: uiSchema,
      selectedTopology: topologyType,
    });

    // Deep-merge updated section values into the existing instance
    const updatedInstance = deepClone(instance) as Instance;
    const specUpdates = (processed as Record<string, unknown>).spec;

    if (specUpdates && typeof specUpdates === 'object') {
      updatedInstance.spec = {
        ...updatedInstance.spec,
        ...(specUpdates as Record<string, unknown>),
      } as Instance['spec'];
    }

    mutate(updatedInstance);
  };

  return (
    <FormDialog
      isOpen
      closeModal={onClose}
      headerMessage={section?.label ?? sectionKey}
      schema={zodSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitMessage="Save"
      size="XL"
      submitting={submitting}
    >
      <UIGenerator
        sectionKey={sectionKey}
        sections={editSections}
        providerObject={provider}
        formMode={FormMode.Edit}
      />
    </FormDialog>
  );
};

export default SectionEditModal;

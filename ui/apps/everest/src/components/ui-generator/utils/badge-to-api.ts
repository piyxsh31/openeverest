import {
  Component,
  ComponentGroup,
  TopologyUISchemas,
} from '../ui-generator.types';

export type BadgeMapping = {
  path: string;
  badge: string;
};

/**
 * Extracts badge mappings from UI schema for fields with badgeToApi=true
 * This allows appending badge suffixes to field values during form submission
 */
export const extractBadgeMappings = (
  schema: TopologyUISchemas,
  selectedTopology: string
): BadgeMapping[] => {
  const badgeMappings: BadgeMapping[] = [];
  const topology = schema[selectedTopology];

  if (!topology || !topology.sections) {
    return badgeMappings;
  }

  const processComponents = (components: {
    [key: string]: Component | ComponentGroup;
  }): void => {
    Object.values(components).forEach((item) => {
      if (item.uiType === 'group' && 'components' in item) {
        // Recursively process group components
        processComponents((item as ComponentGroup).components);
      } else {
        // Handle regular component
        const component = item as Component;
        if (
          'path' in component &&
          component.path &&
          component.fieldParams?.badge &&
          component.fieldParams?.badgeToApi
        ) {
          badgeMappings.push({
            path: component.path,
            badge: component.fieldParams.badge,
          });
        }
      }
    });
  };

  Object.values(topology.sections).forEach((section) => {
    if (section?.components) {
      processComponents(section.components);
    }
  });

  return badgeMappings;
};

/**
 * Applies badge suffixes to form data based on badge mappings
 * Converts dot-notation paths to nested object access and appends badges
 */
export const applyBadgesToFormData = (
  formData: Record<string, unknown>,
  badgeMappings: BadgeMapping[]
): Record<string, unknown> => {
  if (badgeMappings.length === 0) {
    return formData;
  }

  // Deep clone to avoid mutating original data
  const result = JSON.parse(JSON.stringify(formData));

  badgeMappings.forEach(({ path, badge }) => {
    const pathParts = path.split('.');
    let current: any = result;

    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    // Get the final key and apply badge
    const finalKey = pathParts[pathParts.length - 1];
    const value = current[finalKey];

    if (value !== undefined && value !== null && value !== '') {
      // Convert to string, trim, and append badge
      current[finalKey] = `${String(value).trim()}${badge}`;
    }
  });

  return result;
};

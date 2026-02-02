//TODO fix default values
export const getDefaultValues = (
  fields: OpenAPIFields
): Record<string, unknown> => {
  const buildDefaults = (obj: Record<string, any>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value.uiType === 'Group' && value.subParameters) {
        result[key] = buildDefaults(value.subParameters);
      } else {
        if (value.params?.default !== undefined) {
          result[key] = value.params.default;
        } else {
          result[key] = value.uiType
            ? (UI_TYPE_DEFAULT_VALUE[value.uiType] ?? '')
            : '';
        }
      }
    });
    return result;
  };

  const defaults: Record<string, any> = {};

  if (fields.global) {
    defaults.global = {
      params: buildDefaults(fields.global || {}),
    };
  }

  if (fields.components) {
    defaults.components = {};
    Object.entries(fields.components).forEach(([compName, compValue]) => {
      defaults.components[compName] = buildDefaults(compValue || {});
    });
  }

  if (fields.topology) {
    defaults.topology = buildDefaults(fields.topology || {});
    defaults.topology.type = Object.keys(fields.topology)[0];
  }

  return defaults;
};

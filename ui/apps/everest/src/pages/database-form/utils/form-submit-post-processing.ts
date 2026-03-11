// deep merge submit results with base values, removing keys with empty values (undefined, null, '')
// TODO refactoring: this function probably should be a part of ui-generator
export const formSubmitPostProcessing = (
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...base };

  Object.entries(patch).forEach(([key, patchValue]) => {
    const baseValue = result[key];

    if (patchValue === undefined || patchValue === null || patchValue === '') {
      delete result[key];
      return;
    }

    const patchIsObject =
      typeof patchValue === 'object' &&
      patchValue !== null &&
      !Array.isArray(patchValue);

    const baseIsObject =
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue);

    if (patchIsObject) {
      result[key] = formSubmitPostProcessing(
        (baseIsObject ? baseValue : {}) as Record<string, unknown>,
        patchValue as Record<string, unknown>
      );

      const nested = result[key];
      if (
        nested &&
        typeof nested === 'object' &&
        !Array.isArray(nested) &&
        Object.keys(nested as Record<string, unknown>).length === 0
      ) {
        delete result[key];
      }
      return;
    }

    result[key] = patchValue;
  });

  return result;
};

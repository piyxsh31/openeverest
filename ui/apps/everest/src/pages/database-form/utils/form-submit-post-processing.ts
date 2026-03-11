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

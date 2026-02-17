import {
  getZodRulesForFieldType,
  applyZodValidation,
} from 'components/ui-generator/constants';
import {
  Component,
  FieldType,
} from 'components/ui-generator/ui-generator.types';

import { z } from 'zod';

export const buildNumberValidationSchema = (
  component: Component
): z.ZodTypeAny => {
  const isRequired = !!component.validation?.required;
  let numberSchema: z.ZodTypeAny = z.coerce.number();

  // Get field-type-specific validation rules
  const fieldTypeRules = getZodRulesForFieldType(FieldType.Number);

  if (component.validation) {
    Object.entries(component.validation).forEach(([rule, ruleValue]) => {
      // Handle CEL separately
      if (rule === 'celExpressions') return;

      const zodMethod = fieldTypeRules[rule];
      if (!zodMethod) return;
      numberSchema = applyZodValidation(numberSchema, zodMethod, ruleValue);
    });
  }
  // TODO support union type from zod to be able to combine number intervals
  if (isRequired) {
    return z
      .union([z.string().min(1, { message: 'Field is required' }), z.number()])
      .pipe(numberSchema);
  } else {
    // For optional fields: convert empty strings to undefined before validation
    return z
      .union([z.string(), z.number(), z.undefined()])
      .transform((val) => {
        // Treat empty string, undefined, or null as undefined (skip validation)
        if (val === '' || val === undefined || val === null) {
          return undefined;
        }
        return val;
      })
      .pipe(z.union([z.undefined(), numberSchema]))
      .optional();
  }
};

export const buildSelectValidationSchema = (
  component: Component
): z.ZodTypeAny => {
  const isRequired = !!component.validation?.required;
  if (
    component.uiType !== FieldType.Select ||
    !('options' in component.fieldParams)
  ) {
    // Fallback to basic string validation for no options case
    return z.string();
  }

  const optionValues = component.fieldParams.options.map((opt) => opt.value);
  const hasDisplayEmpty = !!component.fieldParams.displayEmpty;

  // This matches the auto-injected empty option in the UI
  const allowedValues =
    !isRequired && hasDisplayEmpty && !optionValues.includes('')
      ? ['', ...optionValues]
      : optionValues;

  if (allowedValues.length === 0) {
    // Fallback to basic string validation for no options case
    return z.string();
  }

  const enumSchema = z.enum(allowedValues as [string, ...string[]]);

  // For select fields, we handle regex validation in the enum refinement
  // to ensure it applies to the selected value(s)
  const regexValidation = component.validation?.regex as
    | { pattern: string; message?: string }
    | undefined;
  const pattern = regexValidation ? new RegExp(regexValidation.pattern) : null;
  const regexMessage = regexValidation?.message || 'Invalid format';

  let baseSchema: z.ZodTypeAny;

  if (isRequired) {
    baseSchema = z.string().min(1, { message: 'Field is required' });

    if (pattern) {
      // Apply regex, then enum
      baseSchema = baseSchema
        .refine((val) => pattern.test(val), { message: regexMessage })
        .refine((val) => allowedValues.includes(val), {
          message: 'Invalid selection',
        });
    } else {
      baseSchema = baseSchema.pipe(enumSchema);
    }
  } else {
    baseSchema = z.union([z.string(), z.undefined()]);

    if (pattern) {
      // Apply regex and enum for non-empty values
      baseSchema = baseSchema
        .refine(
          (val) => {
            if (val === undefined || val === '') return true;
            return pattern.test(val) && allowedValues.includes(val);
          },
          { message: regexMessage }
        )
        .optional();
    } else {
      baseSchema = baseSchema
        .transform((val) => (val === '' ? undefined : val))
        .pipe(z.union([z.undefined(), enumSchema]))
        .optional();
    }
  }

  return baseSchema;
};

export const buildGenericValidationSchema = (
  component: Component,
  baseSchema: z.ZodTypeAny
): z.ZodTypeAny => {
  let fieldSchema = baseSchema;

  if (component.validation) {
    // Get field-type-specific validation rules
    const fieldTypeRules = getZodRulesForFieldType(
      component.uiType as FieldType
    );

    Object.entries(component.validation).forEach(([rule, ruleValue]) => {
      // Skip CEL and regex (handled separately)
      if (rule === 'celExpressions' || rule === 'regex') return;

      const zodMethod = fieldTypeRules[rule];
      if (zodMethod) {
        fieldSchema = applyZodValidation(fieldSchema, zodMethod, ruleValue);
      }
    });
  }

  return fieldSchema;
};

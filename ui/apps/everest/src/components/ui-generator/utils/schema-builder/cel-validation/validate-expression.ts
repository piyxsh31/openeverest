import { evaluate } from '@marcbachmann/cel-js';
import { CelExpression } from 'components/ui-generator/ui-generator.types';

export type CelValidationResult = {
  isValid: boolean;
  message?: string;
};

export const validateCelExpression = (
  celExpression: CelExpression,
  formData: Record<string, unknown>,
  originalData?: Record<string, unknown>
): CelValidationResult => {
  try {
    const context = originalData
      ? { ...formData, original: originalData }
      : formData;
    const result = evaluate(celExpression.celExpr, context);

    // CEL expression should return true for valid, false for invalid
    if (result === false || !result) {
      return {
        isValid: false,
        message:
          celExpression.message ||
          `Validation failed: ${celExpression.celExpr}`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      message: `CEL expression error: ${celExpression.celExpr}`,
    };
  }
};

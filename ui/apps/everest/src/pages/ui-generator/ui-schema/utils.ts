import { z } from 'zod';
import { OpenAPIFields } from './types';
import { UI_TYPE_DEFAULT_VALUE, ZOD_SCHEMA_MAP, zodRuleMap } from './constants';
import { evaluate } from '@marcbachmann/cel-js';
import { Control, useWatch } from 'react-hook-form';
import { useEffect } from 'react';

export const getDefaultValues = (
  fields: OpenAPIFields
): Record<string, unknown> => {
  // Recursively builds default values for a nested object structure
  const buildDefaults = (obj: Record<string, any>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, value]) => {
      // Handle nested groups recursively
      if (value.uiType === 'Group' && value.subParameters) {
        result[key] = buildDefaults(value.subParameters);
      } else {
        // Use explicit default if available, otherwise use UI type default
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

  // Build defaults for global parameters
  if (fields.global) {
    defaults.global = {
      params: buildDefaults(fields.global || {}),
    };
  }

  // Build defaults for each component
  if (fields.components) {
    defaults.components = {};
    Object.entries(fields.components).forEach(([compName, compValue]) => {
      defaults.components[compName] = buildDefaults(compValue || {});
    });
  }

  // Build defaults for topology and set initial topology type
  if (fields.topology) {
    defaults.topology = buildDefaults(fields.topology || {});
    defaults.topology.type = Object.keys(fields.topology)[0];
  }

  return defaults;
};

/**
 * Builds a Zod validation schema from OpenAPI field definitions with CEL expression support.
 * This is the main validation schema builder that:
 * 1. Recursively converts field definitions to Zod schemas
 * 2. Applies validation rules (min, max, length, etc.) from field.validation
 * 3. Collects CEL (Common Expression Language) expressions for cross-field validation
 * 4. Returns both the schema and dependency groups for form re-validation triggers
 *
 * Example input (from openApiObj.components.mongod):
 * {
 *   replicas: {
 *     uiType: 'Number',
 *     validation: { min: 1, max: 99 }
 *   },
 *   storage: {
 *     uiType: 'Group',
 *     subParameters: {
 *       class: { uiType: 'StorageClassSelect' },
 *       size: { uiType: 'Select' }
 *     }
 *   },
 *   resources: {
 *     uiType: 'Group',
 *     subParameters: {
 *       requests1: {
 *         uiType: 'Number',
 *         validation: {
 *           celExpr: 'components.mongod.resources.requests1 >= 10 && components.mongod.resources.requests2 < 4'
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * Example output:
 * {
 *   schema: z.object({
 *     replicas: z.number().min(1).max(99),
 *     storage: z.object({
 *       class: z.string(),
 *       size: z.string()
 *     }),
 *     resources: z.object({
 *       requests1: z.number()
 *     })
 *   }).superRefine((data, ctx) => { ... }),  // CEL validation logic added here
 *
 *   celDependencyGroups: [
 *     ['components.mongod.resources.requests1', 'components.mongod.resources.requests2']
 *   ]
 * }
 *
 * @param fields - The field definitions to convert to Zod schema
 * @param parentKey - Optional parent key path for nested schemas (e.g., 'components.mongod')
 * @returns Object containing the Zod schema and CEL dependency groups for re-validation
 */
export const buildZodSchema = (
  fields: Record<string, any>,
  parentKey = ''
): { schema: z.ZodTypeAny; celDependencyGroups: string[][] } => {
  // Storage for CEL expressions that need cross-field validation
  const celExpValidations: { path: string[]; celExpr: string }[] = [];
  // Groups of fields that depend on each other (used to trigger re-validation)
  const celDependencyGroups: string[][] = [];

  /**
   * Recursively builds Zod object schema from field definitions.
   * Handles both simple fields and nested Groups with subParameters.
   *
   * @param obj - Field definitions object
   * @param path - Current path in the object tree (e.g., ['resources', 'requests1'])
   * @returns Zod object schema
   */
  const buildShape = (
    obj: Record<string, any>,
    path: string[] = []
  ): z.ZodTypeAny => {
    const schemaShape: Record<string, z.ZodTypeAny> = {};
    Object.entries(obj).forEach(([key, value]) => {
      let fieldSchema: z.ZodTypeAny;

      // Handle nested groups recursively
      if (value.uiType === 'Group' && value.subParameters) {
        fieldSchema = buildShape(value.subParameters, [...path, key]);
      } else {
        // Get base Zod schema for this UI type (e.g., z.number() for 'Number')
        fieldSchema = ZOD_SCHEMA_MAP[value.uiType] ?? z.any();

        // Apply validation rules if present
        if (value.validation) {
          Object.entries(value.validation).forEach(([rule, ruleValue]) => {
            // Map validation rule to Zod method (e.g., 'min' -> .min())
            const zodMethod = zodRuleMap[rule];
            if (
              zodMethod &&
              typeof fieldSchema[zodMethod as keyof typeof fieldSchema] ===
                'function'
            ) {
              // Apply the validation method (e.g., z.number().min(1).max(99))
              fieldSchema = (fieldSchema as z.ZodTypeAny)[
                zodMethod as keyof z.ZodTypeAny
              ](ruleValue);
            }
          });

          // Handle CEL expressions for cross-field validation
          if (value.validation.celExpr) {
            // Extract field paths referenced in the CEL expression
            // e.g., 'components.mongod.resources.requests1 >= 10' -> ['components.mongod.resources.requests1']
            const deps = extractCelFieldPaths(value.validation.celExpr).map(
              (p) => p.join('.')
            );
            celDependencyGroups.push(deps);
            celExpValidations.push({
              path: [...path, key],
              celExpr: value.validation.celExpr,
            });
          }
        }
      }
      schemaShape[key] = fieldSchema;
    });
    return z.object(schemaShape);
  };

  let schema = buildShape(fields);

  // If a parentKey is provided, wrap the schema in nested objects
  // This ensures the schema matches the form data structure
  //
  // Example:
  // - Input: parentKey = 'components.mongod', schema = z.object({ replicas: z.number() })
  // - Output: z.object({ components: z.object({ mongod: z.object({ replicas: z.number() }) }) })
  let fieldPath: string[] = [];
  if (parentKey) {
    if (parentKey.includes('.')) {
      // Split nested path (e.g., 'components.mongod' -> ['components', 'mongod'])
      const keys = parentKey.split('.');
      fieldPath = keys;
      // Wrap schema in reverse order to build nested structure
      // Loop from innermost to outermost: mongod -> components
      for (let i = keys.length - 1; i >= 0; i--) {
        schema = z.object({ [keys[i]]: schema });
      }
    } else {
      // Single parent key (e.g., 'global')
      fieldPath = [parentKey];
      schema = z.object({ [parentKey]: schema });
    }
  }

  // Add CEL expression validation using Zod's superRefine
  // This allows complex cross-field validation rules
  if (celExpValidations.length > 0) {
    schema = schema.superRefine((data, ctx) => {
      celExpValidations.forEach(({ path, celExpr }) => {
        // Construct full path including parent key
        const fullPath = [...fieldPath, ...path];
        // Extract all field paths referenced in the CEL expression
        const referencedFields = extractCelFieldPaths(celExpr);
        try {
          // Evaluate the CEL expression against form data
          // Example: evaluate('components.mongod.resources.requests1 >= 10', formData)
          // Returns: true or false
          const result = evaluate(celExpr, data);
          if (!result) {
            // Add validation error to the field that has the CEL expression
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `CEL validation failed: ${celExpr}`,
              path: fullPath,
            });
            // Also add errors to all fields referenced in the expression
            // This highlights dependent fields that caused the validation to fail
            referencedFields.forEach((refPath) => {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Validation failed: ${celExpr}`,
                path: refPath,
              });
            });
          }
        } catch (e) {
          console.log(`Validation error: ${e}`);
        }
      });
    });
  }

  return {
    schema,
    celDependencyGroups,
  };
};

/**
 * Extracts field paths from a CEL (Common Expression Language) expression.
 * Uses regex to find dot-notation paths referenced in the expression.
 *
 * Example inputs and outputs:
 *
 * Input: 'components.mongod.resources.requests1 >= 10'
 * Output: [['components', 'mongod', 'resources', 'requests1']]
 *
 * Input: 'components.mongod.resources.requests1 >= 10 && components.mongod.resources.requests2 < 4'
 * Output: [
 *   ['components', 'mongod', 'resources', 'requests1'],
 *   ['components', 'mongod', 'resources', 'requests2']
 * ]
 *
 * Input: 'global.params.allowUnsafeFlags == true || components.backup.replicas > 0'
 * Output: [
 *   ['global', 'params', 'allowUnsafeFlags'],
 *   ['components', 'backup', 'replicas']
 * ]
 *
 * @param celExpr - CEL expression string
 * @returns Array of field paths, where each path is an array of keys
 */
export const extractCelFieldPaths = (celExpr: string): string[][] => {
  // Regex matches patterns like: word.word.word (at least 2 segments)
  // Matches: components.mongod.replicas, global.params.flag
  // Doesn't match: singleWord, 123, true, false
  const regex = /([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)/g;
  const matches = celExpr.match(regex) || [];
  // Remove duplicates and split each path into an array
  // ['components.mongod.replicas', 'components.mongod.replicas'] -> [['components', 'mongod', 'replicas']]
  return Array.from(new Set(matches)).map((f) => f.split('.'));
};

/**
 * React hook that triggers form re-validation for dependent fields when any field in a dependency group changes.
 * This is used with CEL expressions to ensure cross-field validation runs when related fields are modified.
 *
 * How it works:
 * 1. Watches all fields mentioned in the dependency groups
 * 2. When any watched field changes, triggers validation for all fields in that group
 * 3. This ensures CEL expressions like 'requests1 >= 10 && requests2 < 4' are re-evaluated
 *
 * Example usage (from openApiObj):
 *
 * Dependency groups from buildZodSchema:
 * [
 *   ['components.mongod.resources.requests1', 'components.mongod.resources.requests2'],
 *   ['components.mongod.resources.limits.cpu', 'components.mongod.resources.requests2']
 * ]
 *
 * - User changes 'requests1' from 5 to 15
 * - Hook detects change via useWatch
 * - Triggers validation for: ['components.mongod.resources.requests1', 'components.mongod.resources.requests2']
 * - CEL expression 'requests1 >= 10 && requests2 < 4' is re-evaluated
 * - If requests2 = 2, validation passes; if requests2 = 5, validation fails
 *
 * @param groups - Array of dependency groups from buildZodSchema
 * @param control - React Hook Form control object
 * @param trigger - React Hook Form trigger function to manually trigger validation
 */
export function useTriggerDependentFields(
  groups: string[][],
  control: Control<Record<string, unknown>, unknown>,
  trigger: (fields: string[]) => void
) {
  // Flatten all dependency groups into a unique list of field names to watch
  // [[...], [...]] -> [...] (deduplicated)
  const watchedNames = Array.from(new Set(groups.flat()));
  // Watch all dependent fields for changes
  const watchedValues = useWatch({ control, name: watchedNames });

  // When any watched field changes, re-trigger validation for all groups
  useEffect(() => {
    groups.forEach((group) => {
      trigger(group);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);
}

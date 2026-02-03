import { z } from 'zod';
import {
  Component,
  ComponentGroup,
  TopologyUISchemas,
} from 'components/ui-generator/ui-generator.types';
import { ZOD_SCHEMA_MAP, zodRuleMap } from 'components/ui-generator/constants';
import { generateFieldId } from 'components/ui-generator/utils/renderComponent';

export const buildZodSchema = (
  schema: TopologyUISchemas,
  selectedTopology: string
): { schema: z.ZodTypeAny; celDependencyGroups: string[][] } => {
  const celExpValidations: { path: string[]; celExpr: string }[] = [];
  const celDependencyGroups: string[][] = [];

  const buildShapeFromComponents = (
    components: { [key: string]: Component | ComponentGroup },
    basePath: string = ''
  ): Record<string, z.ZodTypeAny> => {
    const schemaShape: Record<string, z.ZodTypeAny> = {};

    Object.entries(components).forEach(([key, item]) => {
      const generatedName = basePath ? `${basePath}.${key}` : key;
      const fieldId = generateFieldId(item, generatedName);

      let fieldSchema: z.ZodTypeAny;

      // Handle groups recursively
      if (item.uiType === 'group' && 'components' in item) {
        const groupSchema = buildShapeFromComponents(
          (item as ComponentGroup).components,
          generatedName
        );
        // For groups, merge nested schemas into parent level (flat structure)
        Object.assign(schemaShape, groupSchema);
        return;
      }

      // Get base Zod schema for this UI type
      const component = item as Component;
      let baseSchema = ZOD_SCHEMA_MAP[component.uiType] ?? z.any();

      // Apply validation rules if present
      if ('validation' in component && component.validation) {
        // For number types, we need to build the final schema with validation
        if (component.uiType === 'number') {
          let numberSchema = z.coerce.number({
            invalid_type_error: 'Please enter a valid number',
          });

          Object.entries(component.validation).forEach(([rule, ruleValue]) => {
            if (rule === 'celExpr') return;
            // Handle CEL separately

            const zodMethod = zodRuleMap[rule];
            if (
              zodMethod &&
              typeof numberSchema[zodMethod as keyof typeof numberSchema] ===
                'function'
            ) {
              console.log(
                `Applying ${zodMethod}(${ruleValue}) to field ${fieldId}`
              );
              numberSchema = (numberSchema as any)[zodMethod](ruleValue);
            }
          });

          // Wrap with union and pipe for proper coercion
          fieldSchema = z
            .union([z.string().min(1), z.number()])
            .pipe(numberSchema);
        } else {
          // For non-number types, apply validation rules directly
          fieldSchema = baseSchema;
          Object.entries(component.validation).forEach(([rule, ruleValue]) => {
            if (rule === 'celExpr') return; // Handle CEL separately

            const zodMethod = zodRuleMap[rule];
            if (
              zodMethod &&
              typeof fieldSchema[zodMethod as keyof typeof fieldSchema] ===
                'function'
            ) {
              console.log(
                `Applying ${zodMethod}(${ruleValue}) to field ${fieldId}`
              );
              fieldSchema = (fieldSchema as any)[zodMethod](ruleValue);
            }
          });
        }

        // Handle CEL expressions for cross-field validation
        if ('celExpr' in component.validation) {
          celDependencyGroups.push([fieldId]);
          celExpValidations.push({
            path: [fieldId],
            celExpr: component.validation.celExpr as string,
          });
        }
      } else {
        // No validation rules - use base schema as-is
        fieldSchema = baseSchema;
      }

      schemaShape[fieldId] = fieldSchema;
      console.log(`Schema field added: ${fieldId}`, fieldSchema);
    });

    return schemaShape;
  };

  const convertToNestedSchema = (
    flatSchema: Record<string, z.ZodTypeAny>
  ): Record<string, z.ZodTypeAny> => {
    const nested: Record<string, any> = {};

    Object.entries(flatSchema).forEach(([path, zodType]) => {
      const keys = path.split('.');
      let current = nested;

      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          // Last key - set the Zod type
          current[key] = zodType;
        } else {
          // Intermediate key - ensure object exists
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
      });
    });

    // Convert nested objects to z.object() schemas recursively
    const convertToZod = (obj: any): z.ZodTypeAny => {
      const shape: Record<string, z.ZodTypeAny> = {};

      Object.entries(obj).forEach(([key, value]) => {
        if (
          value &&
          typeof value === 'object' &&
          !(value instanceof z.ZodType)
        ) {
          // Nested object - convert recursively
          shape[key] = convertToZod(value);
        } else {
          // Zod type - use as-is
          shape[key] = value as z.ZodTypeAny;
        }
      });

      return z.object(shape);
    };

    return Object.fromEntries(
      Object.entries(nested).map(([key, value]) => [
        key,
        typeof value === 'object' && !(value instanceof z.ZodType)
          ? convertToZod(value)
          : value,
      ])
    );
  };

  // for selected topology only
  const buildCompleteSchema = (): z.ZodTypeAny => {
    const topology = schema[selectedTopology];

    if (!topology || !topology.sections) {
      console.warn(`No topology found for key: ${selectedTopology}`);
      return z.object({});
    }

    let flatFields: Record<string, z.ZodTypeAny> = {};

    // TODO typescript error
    Object.entries(topology.sections).forEach(([sectionKey, section]) => {
      if (section?.components) {
        const sectionSchema = buildShapeFromComponents(
          section.components,
          sectionKey
        );
        Object.assign(flatFields, sectionSchema);
      }
    });

    // Convert flat schema to nested structure
    const nestedFields = convertToNestedSchema(flatFields);
    console.log('Nested schema structure:', nestedFields);

    return z.object(nestedFields);
  };

  let zodSchema = buildCompleteSchema();

  console.log('Final Zod Schema built:', zodSchema);

  // TODO finish CEL expression validation using superRefine
  if (celExpValidations.length > 0) {
    zodSchema = zodSchema.superRefine((data, ctx) => {
      celExpValidations.forEach(({ path, celExpr }) => {
        // Placeholder for CEL evaluation
        // In production, you would use: evaluate(celExpr, data)
        console.log(
          'CEL validation would run here:',
          celExpr,
          'for field:',
          path
        );
      });
    });
  }

  return {
    schema: zodSchema,
    celDependencyGroups,
  };
};

import { SelectInput, TextInput } from '@percona/ui-lib';
import { FieldType, GroupType } from './ui-generator.types';
import AccordionWrapper from './ui-group-wrappers/accordion-wrapper';
import StackWrapper from './ui-group-wrappers/stack-wrapper';
import { z } from 'zod';

export const UI_TYPE_DEFAULT_VALUE: Record<
  Exclude<FieldType, 'hidden'>,
  unknown
> = {
  [FieldType.Number]: 3,
  //   [FieldType.Switch]: false,
  //   [FieldType.Checkbox]: false,
  //   [FieldType.Toggle]: false,
  //   [FieldType.TextArea]: 'lorem ipsum',
  //   [FieldType.Input]: '',
  //   [FieldType.StorageClassSelect]: 'lorem ipsum',
  //   [FieldType.SecretSelector]: '',
  //   [FieldType.String]: '',
  [FieldType.Select]: '',
};

export const componentGroupMap: Record<string, React.ElementType> = {
  [GroupType.Accordion]: AccordionWrapper,
  [GroupType.Line]: StackWrapper,
};
export const muiComponentMap: Record<FieldType, React.ElementType> = {
  [FieldType.Number]: TextInput,
  [FieldType.Select]: SelectInput,
  [FieldType.Hidden]: () => null,
};

//TODO it would be better to export full list of ZodValidation mapping to field types
export const zodRuleMap: Record<string, string> = {
  min: 'min',
  max: 'max',
  minLength: 'min',
  maxLength: 'max',
  length: 'length',
  email: 'email',
  url: 'url',
  regex: 'regex',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
  includes: 'includes',
  uuid: 'uuid',
};

export const ZOD_SCHEMA_MAP: Record<
  Exclude<FieldType, 'hidden'>,
  z.ZodTypeAny
> = {
  [FieldType.Number]: z.union([z.string().min(1), z.number()]).pipe(
    z.coerce.number({
      invalid_type_error: 'Please enter a valid number',
    })
  ),
  [FieldType.Select]: z.string(),
  // [FieldType.Input]: z.string(),
  // [FieldType.Switch]: z.boolean(),
  // [FieldType.Checkbox]: z.boolean(),
  // [FieldType.String]: z.string().min(5),
  // [FieldType.TextArea]: z.string().min(5),
};

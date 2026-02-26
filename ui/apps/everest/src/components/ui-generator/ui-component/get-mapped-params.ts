import { SelectProps, TextFieldProps } from '@mui/material';
import {
  NumberFieldParams,
  SelectFieldParams,
  FieldParamsMap,
  ValidationMap,
  FieldType,
} from '../ui-generator.types';

// Helper to filter out undefined values from an object
const filterDefined = <T extends Record<string, unknown>>(
  obj: T
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
};

export const getMappedParams = <K extends keyof FieldParamsMap>(
  fieldType: K,
  fieldParams: FieldParamsMap[K],
  validation?: ValidationMap[K]
) => {
  switch (fieldType) {
    case 'number':
      return mapNumberFieldParams(fieldParams as NumberFieldParams, validation);
    case 'select':
      return mapSelectFieldParams(fieldParams as SelectFieldParams);
    // Add more cases for other field types as needed
    default:
      return fieldParams;
  }
};

const mapNumberFieldParams = (
  fieldParams: NumberFieldParams,
  validation?: ValidationMap[FieldType.Number]
) => {
  const {
    step,
    disabled,
    helperText,
    badge,
    autoFocus,
    placeholder,
    ...rest
  } = fieldParams;

  const textFieldProps: Partial<TextFieldProps> = filterDefined({
    type: 'number' as const,
    disabled,
    helperText,
    autoFocus,
    placeholder,
  });

  // const getOffset = (): number => {
  //   if (validation?.int) {
  //     return 1;
  //   }
  //   if (step !== undefined) {
  //     return step;
  //   }
  //   return 0.000001;
  // };

  // const offset = getOffset();

  // // Priority: explicit min/max > converted gt/lt
  // const minValue =
  //   validation?.min !== undefined
  //     ? validation.min
  //     : validation?.gt !== undefined
  //       ? validation.gt + offset
  //       : undefined;

  // const maxValue =
  //   validation?.max !== undefined
  //     ? validation.max
  //     : validation?.lt !== undefined
  //       ? validation.lt - offset
  //       : undefined;

  // const inputProps = filterDefined({
  //   min: minValue,
  //   max: maxValue,
  //   step,
  // });

  // if (Object.keys(inputProps).length > 0) {
  //   textFieldProps.inputProps = inputProps;
  // }

  //TODO custom logic for badge will be added via textFieldProps.InputProps in UIComponent
  // Badge passed separately to UIComponent which will handle InputAdornment rendering
  // We keep the badge in the return value so UIComponent can access it


  return {
    ...rest,
    textFieldProps: {
      ...textFieldProps,
      // inputProps: {
      //   ...inputProps,
      // },
      
    },
    badge,
  };
};

const mapSelectFieldParams = (fieldParams: SelectFieldParams) => {
  const {
    disabled,
    helperText,
    autoFocus,
    multiple,
    displayEmpty,
    defaultOpen,
    readOnly,
    badge,
    ...rest
  } = fieldParams;

  const selectFieldProps: Partial<SelectProps> = filterDefined({
    disabled,
    autoFocus,
    multiple,
    displayEmpty,
    defaultOpen,
    readOnly,
  });

  return {
    ...rest,
    badge,
    selectFieldProps,
    helperText,
  };
};

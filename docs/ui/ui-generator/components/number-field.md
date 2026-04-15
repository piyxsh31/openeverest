# Number Field

## Table of Contents

- [Properties](#properties)
- [Native Validation](#native-validation)
- [Validation and HTML Input](#validation-and-html-input)
- [Payload Format](#payload-format)
- [Examples](#examples)
  - [Basic Number Field](#basic-number-field)
  - [Exclusive Bounds](#exclusive-bounds)
  - [Regexp](#regexp)
  - [CEL](#cel)

A numeric input field for integer and decimal values.

## Properties:

- `uiType`: `"number"` (required)
- `path` OR `id`: Data path or unique identifier (required)
- `fieldParams`: Configuration object with the following optional properties:
  - `label`: Display label for the field
  - `placeholder`: Placeholder text shown when field is empty
  - `defaultValue`: Default numeric value
  - `disabled`: Whether the field is disabled (default: `false`)
  - `autoFocus`: Automatically focus this field on render
  - `helperText`: Help text displayed below the field
  - `step`: Increment/decrement step for arrow buttons (e.g., `0.1`, `5`, `10`)
  - `payloadFormat`: Override the type of the value sent to the API (see [Payload Format](#payload-format))
- `validation` (optional): Validation rules object with the following properties:
  - `required`: Whether the field is required (default: `false`)
  - `min`: Minimum value (inclusive) - value must be >= specified number
  - `max`: Maximum value (inclusive) - value must be <= specified number
  - `gt`: Greater than (exclusive) - value must be > specified number
  - `lt`: Less than (exclusive) - value must be < specified number
  - `int`: Must be an integer (boolean: `true`)
  - `multipleOf`: Value must be a multiple of specified number
  - `safe`: Must be a safe integer within JavaScript's safe integer range (boolean: `true`)
  - `regex`: Regular expression validation (see [Regex Validation](./Readme.md#regex-validation))
  - `celExpressions`: Array of CEL validation expressions for cross-field validation (see [CEL Expression Validation](./Readme.md#cel-expression-validation))

## Native Validation:

Validates that input is numeric

## Payload Format

By default, number fields send their value to the API as a JavaScript `number`. Some APIs (e.g. Kubernetes `IntOrString` fields like CPU) require the value as a `string` instead.

Use `payloadFormat` to control the type of the value in the API payload:

- `"string"` — convert to string (e.g. `0.6` → `"0.6"`)
- `"number"` — keep as number (default behavior)
- `"boolean"` — convert to boolean

```yaml
cpu:
  uiType: number
  path: spec.resources.cpu
  fieldParams:
    label: CPU
    defaultValue: 1
    step: 0.1
    payloadFormat: "string"
  validation:
    min: 0.6
    required: true
```

## Examples:

[OpenEverest TextInput “Number type” Story](https://openeverest.io/openeverest/?path=/story/textinput--number-type)

### Basic Number Field

```yaml
replicas:
  uiType: number
  path: spec.replicas
  fieldParams:
    label: Number of Replicas
    defaultValue: 3
    step: 1
    autoFocus: true
  validation:
    required: true
    min: 1
    max: 16
    int: true
```

### Exclusive Bounds

```yaml
validation:
  gt: 0
  lt: 32
  multipleOf: 0.5
```

**Note:** Fields are optional by default. To make a field required, set `required: true` in the `validation` object. Validation rules (min/max/etc.) only apply when a value is entered.

### Regexp

```yaml
portNumber:
  uiType: number
  path: spec.port
  fieldParams:
    label: Port Number
  validation:
    regex:
      pattern: "^[1-9][0-9]{3,4}$"
      message: Port must be between 1000-99999
```

### CEL

> Documentation coming soon.

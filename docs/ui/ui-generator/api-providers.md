# API Providers

## Table of Contents

- [What Is It](#what-is-it)
- [How It Works](#how-it-works)
- [How To Use It](#how-to-use-it)
  - [Properties](#properties)
  - [fieldParams](#fieldparams)
  - [Validation](#validation)
  - [Modes](#modes)
  - [Field Behavior](#field-behavior)
- [Available Providers](#available-providers)
- [Examples](#examples)
  - [Required select with monitoring configs](#required-select-with-monitoring-configs)
  - [Optional select with empty placeholder](#optional-select-with-empty-placeholder)

## What Is It

`dataSource` is a property you can add to any `select` field so that its options are loaded from an Everest API at runtime instead of being declared statically in the schema.

The options are scoped to the current cluster and namespace context of the form — each user sees only the resources that exist in their environment.

## How It Works

When the form opens, the field fetches its options from the API. While loading, the field is disabled and shows `Loading...`. If the fetch fails, the field stays disabled and shows `Failed to load options`. If the fetch succeeds but returns no items, the field shows `No options available` (or the `helperText` you defined) and remains interactive.

Because the field is still a standard select, all regular select validation rules — `required`, `regex`, CEL expressions — work exactly as documented in [SelectField](components/select-field.md).

If you specify a `dataSource.provider` that does not exist in the registry, a warning is logged in the browser console during schema preprocessing with a list of available provider keys.

## How To Use It

### Properties

```yaml
fieldKey:
  uiType: select # Required — dataSource works with select fields
  dataSource:
    provider: <providerKey> # Required — see Available Providers
    config: { ... } # Optional
  path: <dot.separated.api.path> # Required if the value should be submitted
  id: <uniqueId> # Alternative to path for UI-only fields
  fieldParams: { ... } # Optional — see fieldParams
  validation: { ... } # Optional — same as SelectField validation
  modes: { ... } # Optional — same as any other field
```

**`uiType`** _(required)_

Must be `select` when using `dataSource`.

**`dataSource.provider`** _(required)_

The key of the provider to use. Must match one of the [available providers](#available-providers). If the key is unknown, a warning is printed and the field renders with no options.

**`path` / `id`**

`dataSource` fields use the same `path`, multi-path, and `id` rules as every other UI Generator component. See [Path vs ID](../Readme.md#path-vs-id).

**`dataSource.config`**

> **TODO:** Document supported `dataSource.config` overrides after the API is finalized.

### fieldParams

`fieldParams` for an API provider field follows the same structure as [SelectField fieldParams](components/select-field.md#properties), except `options` are always provided by the API and must not be specified manually.

Supported keys:

| Key            | Type      | Default | Description                                                                                                                 |
| -------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `label`        | `string`  | —       | Display label shown above the field                                                                                         |
| `helperText`   | `string`  | —       | Text shown below the field. When options are empty and no helperText is set, `No options available` is shown automatically. |
| `disabled`     | `boolean` | `false` | Disable the field regardless of loading state                                                                               |
| `defaultValue` | `string`  | `""`    | Pre-selected value. Must match one of the option values that the provider will return.                                      |
| `displayEmpty` | `boolean` | `false` | When `true` and the field is optional, an empty "None" option is automatically added so the user can clear their selection. |
| `readOnly`     | `boolean` | `false` | Show the value but prevent changes                                                                                          |
| `autoFocus`    | `boolean` | `false` | Focus this field when the form opens                                                                                        |

### Validation

Validation is declared under `validation` and works identically to [SelectField validation](components/select-field.md#native-validation):

```yaml
validation:
  required: true # field must have a value before submit
  regex:
    pattern: "^prod-.*"
    message: Must start with prod-
  celExpressions:
    - celExpr: "self != 'disabled-config'"
      message: This config is not allowed
```

The selected value is automatically validated against the set of options returned by the API (enum validation).

### Modes

`modes` works the same as for any other field. You can override any `fieldParams` property or `uiType` per form mode:

```yaml
monitoringEndpoint:
  uiType: select
  dataSource:
    provider: monitoringConfigs
  path: spec.components.monitoring.customSpec.monitoringConfigName
  fieldParams:
    label: Monitoring endpoint
    modes:
      edit:
        helperText: Changing this will restart the monitoring agent
```

See [Mode-Aware Overrides](../Readme.md#mode-aware-overrides) for the full list of supported per-mode overrides.

### Field Behavior

| State               | Field    | Displayed text                                |
| ------------------- | -------- | --------------------------------------------- |
| Loading             | disabled | `Loading...`                                  |
| Fetch failed        | disabled | `Failed to load options`                      |
| Loaded, no options  | enabled  | `No options available` (or your `helperText`) |
| Loaded, has options | enabled  | your `helperText` (if set)                    |

## Available Providers

### `monitoringConfigs`

Returns the names of all `MonitoringConfig` resources in the current namespace as select options.

Each option has the form `{ label: <name>, value: <name> }`.

```yaml
dataSource:
  provider: monitoringConfigs
```

## Examples

### Required select with monitoring configs

```yaml
monitoringEndpoint:
  uiType: select
  dataSource:
    provider: monitoringConfigs
  path: spec.components.monitoring.customSpec.monitoringConfigName
  fieldParams:
    label: Monitoring endpoint
  validation:
    required: true
```

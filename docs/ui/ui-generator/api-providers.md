# API Providers

Select fields whose options come from an Everest API at runtime.

## Quick Start

```yaml
storageClass:
  uiType: select
  dataSource:
    provider: storageClasses
  path: spec.engine.storage.class
  fieldParams:
    label: Storage class
```

That's it. Options load automatically, first option is selected by default, and loading/error states are handled.

## Schema Reference

```yaml
fieldKey:
  uiType: select
  dataSource:
    provider: <providerKey>   # required — see Available Providers
    config:                   # optional
      refetchInterval: 5000
  path: <dot.separated.path>  # required if the value should be submitted
  fieldParams:
    label: string
    helperText: string        # shown below; defaults to "No options available" when empty
    disabled: boolean         # always disabled, regardless of loading state
    defaultValue: string      # overrides auto-selection of first option
    displayEmpty: boolean     # adds empty "None" option for optional fields
  validation:                 # same as regular select — required, regex, celExpressions
    required: true
  modes:                      # per-mode overrides — same as any field
    edit:
      helperText: Changing this will restart the agent
```

## Available Providers

| Key                 | Returns                                          | Scoped to         |
| ------------------- | ------------------------------------------------ | ----------------- |
| `monitoringConfigs` | MonitoringConfig resource names                  | cluster/namespace |
| `storageClasses`    | StorageClass names available on the cluster       | cluster           |

## Field Behavior

| State              | Field    | Text                       |
| ------------------ | -------- | -------------------------- |
| Loading            | disabled | Loading...                 |
| Fetch failed       | disabled | Failed to load options     |
| No options         | enabled  | No options available       |
| Options loaded     | enabled  | first option auto-selected |

## Adding a New Provider

1. Create a `useXxxOptions` hook in `hooks/api/<resource>/` that accepts `ProviderParams` and returns `ProviderOptions`.
2. Register it in `api-providers/providers.ts`:
   ```ts
   import { useXxxOptions } from 'hooks/api/<resource>/useXxxOptions';

   providerRegistry.register('xxx', {
     description: 'Short description.',
     useOptions: useXxxOptions,
   });
   ```
3. Use `provider: xxx` in your schema.

### ProviderParams / ProviderOptions types

```ts
interface ProviderParams {
  namespace: string;
  cluster: string;
  config?: { refetchInterval?: number };
}

interface ProviderOptions {
  options: Array<{ label: string; value: string }>;
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  rawData?: unknown;
}
```

## Architecture

```
Schema (provider CRD)
  → preprocessing warns on unknown providers
  → DataSourceField wraps the select at render time
  → useProviderOptions calls the registered hook
  → options + default value flow into the form
```

Key files:
- `api-providers/providers.ts` — provider registrations
- `api-providers/registry.ts` — singleton registry + `useProviderOptions`
- `api-providers/data-source-field/` — runtime wrapper that patches options and sets default value
- `hooks/api/<resource>/use*Options.ts` — data-fetching hooks

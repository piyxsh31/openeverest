# Controller Package

This package contains the core controller abstractions for building Everest providers.

## Key Files

| File | Purpose |
|------|---------|
| `common.go` | The `Context` handle and resource operations |
| `interface.go` | Provider interface types (`ProviderInterface`, `BaseProvider`) |
| `metadata.go` | Provider spec helper functions and YAML generation |
| `generate.go` | CLI manifest generation utilities |

## Main Concepts

### The Context Handle (`common.go`)

The `Context` struct is the main interface for provider code:

```go
type Context struct {
    ctx          context.Context
    client       client.Client
    in           *v1alpha1.Instance
    providerName string
}

// Key methods:
c.Name()           // Instance name
c.Namespace()      // Instance namespace
c.Spec()           // Instance spec
c.Apply(obj)       // Create/update with owner reference
c.Get(obj, name)   // Read resource
c.Delete(obj)      // Delete resource
c.ProviderSpec()   // Fetch Provider spec from cache (always up-to-date)
```

## Provider Interface

Implement the `ProviderInterface` to create a provider:

```go
type ProviderInterface interface {
    Name() string
	Validate(c *Context) error
	Sync(c *Context) error
	Status(c *Context) (Status, error)
	Cleanup(c *Context) error
}
```

Use `BaseProvider` to inherit default implementations:

```go
type MyProvider struct {
    controller.BaseProvider
    client client.Client
}

func NewMyProvider(mgr ctrl.Manager) *MyProvider {
    return &MyProvider{
        BaseProvider: controller.BaseProvider{
            ProviderName: "mydb",
        },
        client: mgr.GetClient(),
    }
}

// Implement required methods
func (p *MyProvider) Validate(c *controller.Context) error { ... }
func (p *MyProvider) Sync(c *controller.Context) error { ... }
func (p *MyProvider) Status(c *controller.Context) (controller.Status, error) { ... }
func (p *MyProvider) Cleanup(c *controller.Context) error { ... }
```

Scheme registration (e.g. `mydbv1.AddToScheme`) is passed directly to
`reconciler.SetupManager`, not through the provider:

```go
mgr, err := reconciler.SetupManager(mydbv1.AddToScheme)
provider := NewMyProvider(mgr)
r, err := reconciler.New(ctx, mgr, provider)
```

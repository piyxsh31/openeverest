# E2E Tests

End-to-end tests for the Everest UI, powered by [Playwright](https://playwright.dev/).

## Architecture

Tests run against a **deployed Everest instance** (not a Vite dev server).
In CI the binary serves the pre-built UI on port **8080** inside a K3D cluster;
locally you can point `EVEREST_URL` at any running Everest deployment.

### Project structure

```
.e2e/
├── setup/           # Per-concern setup modules (auth, backup-storage, monitoring, session)
├── teardown/        # Matching teardown modules
├── utils/           # Shared helpers (API requests, k8s, localStorage, …)
├── pr/              # Fast tests executed on every pull request
├── release/         # Long-running release-gating tests
├── upgrade/         # Pre/post Everest upgrade tests
├── components/      # Component-level detail tests
├── playwright.config.ts
├── constants.ts
├── Makefile         # CI & local orchestration targets
├── .env             # Local environment template
└── .env.test        # Placeholder environment template
```

Playwright projects are organised with **granular dependency chains** so that
setup/teardown runs only once while test groups can execute in parallel (4 workers).

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x | |
| pnpm | 9.4+ | |
| Go | see `go.mod` | for building Everest CLI / server |
| kubectl | latest | |
| K3D | latest | CI cluster runtime |
| Docker | latest | for building images |

## Quick start (local)

1. **Start a K3D cluster with Everest deployed** (from repo root):

   ```bash
   make k3d-cluster-up
   # build UI + server + operator, upload images, deploy
   cd ui && make init && make build EVEREST_OUT_DIR=../public/dist && cd ..
   make build-debug docker-build k3d-upload-server-image
   make docker-build-operator k3d-upload-operator-image
   make build-cli-debug
   make deploy DB_NAMESPACES=everest-ui
   ```

   Or use the Tilt-based dev flow described in `dev/README.md`.

2. **Prepare the test environment**:

   ```bash
   cd ui/apps/everest/.e2e
   make init                 # install deps + Chromium
   make deploy-minio         # deploy MinIO for backup storage tests
   make deploy-monitoring    # deploy PMM for monitoring tests
   make create-db-namespaces # create psmdb-only, pxc-only, pg-only namespaces
   ```

3. **Run all PR tests**:

   ```bash
   make test                 # PROJECT=pr by default
   ```

   To run a specific project group:

   ```bash
   make test PROJECT=pr FLAGS="--headed"
   ```

## CI workflow

The GitHub Actions workflow (`.github/workflows/dev-fe-e2e.yaml`) automates the
full flow:

1. Checkout → Go + K3D tools setup
2. Create K3D cluster (`make k3d-cluster-up`)
3. Build UI, server binary, Docker images → upload to K3D
4. Deploy Everest with `everest-ui` namespace
5. Add per-engine namespaces (`psmdb-only`, `pxc-only`, `pg-only`)
6. `make init deploy-minio deploy-monitoring` in `.e2e/`
7. `make test` — runs Playwright with all env vars injected

## Monitoring (PMM) setup

Tests that verify monitoring features require a running
[Percona Monitoring and Management (PMM)](https://docs.percona.com/percona-monitoring-and-management/)
instance inside the cluster.

The `deploy-monitoring` Make target installs PMM via the Percona Helm chart:

```bash
helm repo add percona https://percona.github.io/percona-helm-charts/
helm install pmm \
  --set secret.pmm_password='admin',service.type=ClusterIP \
  percona/pmm \
  --version 1.3.21 \
  --timeout 2m --wait
```

After deployment the `make test` target automatically discovers the PMM ClusterIP
and exports `MONITORING_URL`, `MONITORING_USER`, and `MONITORING_PASSWORD`.

## Environment variables

| Variable | Description | Default (CI) |
|----------|-------------|--------------|
| `EVEREST_URL` | Base URL of the running Everest instance | `http://localhost:8080` |
| `CI_USER` / `CI_PASSWORD` | Admin credentials | `admin` / `admin` |
| `SESSION_USER` / `SESSION_PASS` | Non-admin session test user | `session` / `session1234` |
| `RBAC_USER` / `RBAC_PASSWORD` | RBAC test user | `rbac_user` / `rbac-e2e-test` |
| `MONITORING_URL` | PMM instance URL | auto-detected |
| `MONITORING_USER` / `MONITORING_PASSWORD` | PMM credentials | `admin` / `admin` |
| `EVEREST_BUCKETS_NAMESPACES_MAP` | JSON map of bucket→namespace | see Makefile |
| `EVEREST_LOCATION_*` | S3/MinIO connection details | `minioadmin` creds |

## Makefile targets

| Target | Description |
|--------|-------------|
| `init` | Install dependencies and Playwright Chromium browser |
| `ci-init` | Full CI preparation (init + minio + monitoring + namespaces + RBAC) |
| `deploy-minio` | Deploy MinIO to the cluster |
| `deploy-monitoring` | Deploy PMM to the cluster |
| `create-db-namespaces` | Create per-engine namespaces |
| `configure-rbac` | Grant admin user full RBAC permissions |
| `test` | Run E2E tests (override `PROJECT` and `FLAGS`) |

## Troubleshooting

- **Tests time out waiting for elements**: Ensure `EVEREST_URL` points to a
  reachable Everest instance and the UI is built into the binary.
- **Backup storage tests fail**: Verify MinIO is deployed and the
  `EVEREST_LOCATION_*` env vars match.
- **Monitoring tests fail**: Verify PMM is running (`kubectl get pods -l app.kubernetes.io/name=pmm`)
  and `MONITORING_URL` resolves.
- **Auth errors**: Check that `CI_USER`/`CI_PASSWORD` match the admin account
  created during `make deploy`.

REPO_ROOT=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))/../../../..
REPO_ROOT_MAKEFILE=$(REPO_ROOT)/Makefile
HELM=go tool -modfile=$(REPO_ROOT)/go.mod helm

##@ General
.PHONY: default
default: help

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Environment preparation

.PHONY: init
init: ## Install test dependencies.
	$(info Installing dependencies)
	cd $(REPO_ROOT)/ui && pnpm install
	$(info Install Chromium for Playwright)
	npx playwright install --with-deps chromium

.PHONY: configure-rbac
configure-rbac: ## Grant admin user full RBAC permissions for E2E tests.
	$(info Configuring RBAC for E2E test admin user)
	kubectl patch configmap everest-rbac -n everest-system --type=merge \
		-p '{"data":{"policy.csv":"g,admin,role:admin\np,role:admin,*,*,*\ng,rbac_user,role:e2e-rbac-user\np,role:e2e-rbac-user,namespaces,read,*"}}'

CI_INIT_DEPS := init deploy-minio create-db-namespaces deploy-monitoring configure-rbac
.PHONY: ci-init
ci-init: $(CI_INIT_DEPS) ## Prepare CI environment for running tests.

MINIO_RESOURCE=$(REPO_ROOT)/.github/minio.conf.yaml
.PHONY: deploy-minio
deploy-minio: ## Deploy MinIO to the test cluster.
	$(info Installing MinIO instance to test cluster)
	kubectl apply -f $(MINIO_RESOURCE)

PMM_HELM_CHART_VER=1.3.21
.PHONY: deploy-monitoring
deploy-monitoring: ## Deploy PMM monitoring to the test cluster.
	$(info Deploying PMM instances to test cluster)
	$(HELM) repo add percona https://percona.github.io/percona-helm-charts/
	$(HELM) install pmm --set secret.pmm_password='admin',service.type=ClusterIP percona/pmm --version $(PMM_HELM_CHART_VER) --timeout 2m --wait

.PHONY: create-db-namespaces
create-db-namespaces: ## Create per-engine DB namespaces used by tests.
	$(info Creating DB namespaces in Everest)
	$(MAKE) -f $(REPO_ROOT_MAKEFILE) add-psmdb-namespaces DB_NAMESPACES=psmdb-only
	$(MAKE) -f $(REPO_ROOT_MAKEFILE) add-pxc-namespaces DB_NAMESPACES=pxc-only
	$(MAKE) -f $(REPO_ROOT_MAKEFILE) add-pg-namespaces DB_NAMESPACES=pg-only

##@ Test

# Override to run specific projects, e.g. make test PROJECT=pr,release
PROJECT = pr
FLAGS =
.PHONY: test
test: ## Run E2E tests.
	@{ \
	set -xe ;\
	PMM_IP=$$(kubectl get svc/monitoring-service -o json --request-timeout=2m | jq -r '.spec.clusterIP') ;\
	if [ -z "$${PMM_IP}" ]; then echo "Cannot get PMM_IP" ; exit 1 ; fi ;\
	export MONITORING_URL="http://$${PMM_IP}" ;\
	export MONITORING_USER="admin" ;\
	export MONITORING_PASSWORD="admin" ;\
	export CI_USER="admin" ;\
	export CI_PASSWORD="admin" ;\
	export RBAC_USER="rbac_user" ;\
	export RBAC_PASSWORD="rbac-e2e-test" ;\
	export SESSION_USER="session" ;\
	export SESSION_PASS="session1234" ;\
	export EVEREST_URL="http://localhost:8080" ;\
	export EVEREST_BUCKETS_NAMESPACES_MAP='[["bucket-1","everest-ui"],["bucket-2","psmdb-only"],["bucket-3","pxc-only"],["bucket-4","pg-only"],["bucket-5","everest-ui"]]' ;\
	export EVEREST_LOCATION_ACCESS_KEY="minioadmin" ;\
	export EVEREST_LOCATION_SECRET_KEY="minioadmin" ;\
	export EVEREST_LOCATION_REGION="us-east-1" ;\
	export EVEREST_LOCATION_URL="https://minio.minio.svc.cluster.local" ;\
	projects=$$(echo $(PROJECT) | tr ',' ' ') ;\
	cmd_proj="" ;\
	for project in $${projects} ; do \
	  cmd_proj="$${cmd_proj} --project=$${project}" ;\
	done ;\
	npx playwright test --config=./playwright.config.ts $${cmd_proj} $${FLAGS} ;\
	}

// Copyright (C) 2026 The OpenEverest Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package v1alpha1

import (
	"context"
	"errors"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"

	monitoringv1alpha1 "github.com/openeverest/openeverest/v2/api/monitoring/v1alpha1"
	"github.com/openeverest/openeverest/v2/pkg/pmm"
)

// nolint:unused
// log is for logging in this package.
var monitoringconfiglog = logf.Log.WithName("monitoringconfig-resource")

// SetupMonitoringConfigWebhookWithManager registers the webhook for MonitoringConfig in the manager.
func SetupMonitoringConfigWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr, &monitoringv1alpha1.MonitoringConfig{}).
		WithValidator(&MonitoringConfigCustomValidator{
			Client:    mgr.GetClient(),
			apiReader: mgr.GetAPIReader(),
		}).
		WithDefaulter(&MonitoringConfigCustomDefaulter{}).
		Complete()
}

// +kubebuilder:webhook:path=/validate-monitoring-openeverest-io-v1alpha1-monitoringconfig,mutating=false,failurePolicy=fail,sideEffects=None,groups=monitoring.openeverest.io,resources=monitoringconfigs,verbs=create;update,versions=v1alpha1,name=vmonitoringconfig-v1alpha1.kb.io,admissionReviewVersions=v1

// MonitoringConfigCustomValidator struct is responsible for validating the MonitoringConfig resource
// when it is created, updated, or deleted.
type MonitoringConfigCustomValidator struct {
	Client client.Client
	// apiReader bypasses the cache and directly reads from the API server.
	apiReader client.Reader
}

// ValidateCreate implements webhook.CustomValidator so a webhook will be registered for the type MonitoringConfig.
func (v *MonitoringConfigCustomValidator) ValidateCreate(ctx context.Context, obj *monitoringv1alpha1.MonitoringConfig) (admission.Warnings, error) {
	monitoringconfiglog.Info("Validation for MonitoringConfig upon creation", "name", obj.GetName())

	return nil, v.validateMonitoringConfig(ctx, obj)
}

// ValidateUpdate implements webhook.CustomValidator so a webhook will be registered for the type MonitoringConfig.
func (v *MonitoringConfigCustomValidator) ValidateUpdate(ctx context.Context, oldObj, newObj *monitoringv1alpha1.MonitoringConfig) (admission.Warnings, error) {
	monitoringconfiglog.Info("Validation for MonitoringConfig upon update", "name", newObj.GetName())

	return nil, v.validateMonitoringConfig(ctx, newObj)
}

// ValidateDelete implements webhook.CustomValidator so a webhook will be registered for the type MonitoringConfig.
func (v *MonitoringConfigCustomValidator) ValidateDelete(_ context.Context, obj *monitoringv1alpha1.MonitoringConfig) (admission.Warnings, error) {
	return nil, nil
}

// validateMonitoringConfig performs checks secret contains valid PMM API key
// by sening a request to PMM server.
func (v *MonitoringConfigCustomValidator) validateMonitoringConfig(ctx context.Context, mc *monitoringv1alpha1.MonitoringConfig) error {
	if !mc.DeletionTimestamp.IsZero() {
		return nil
	}

	secretName := mc.Spec.CredentialsSecretName
	if secretName == "" {
		return errors.New("missing secret name")
	}

	secret := corev1.Secret{}
	if err := v.apiReader.Get(ctx, types.NamespacedName{
		Name:      secretName,
		Namespace: mc.GetNamespace(),
	}, &secret); err != nil {
		return fmt.Errorf("failed to get secret: %w", err)
	}

	apiKey, ok := secret.Data["apiKey"]
	if !ok {
		return fmt.Errorf("missing apiKey in the secret %s", secretName)
	}

	var skipVerifyTLS bool
	if mc.Spec.VerifyTLS != nil {
		skipVerifyTLS = !*mc.Spec.VerifyTLS
	}

	_, err := pmm.GetPMMServerVersion(ctx, mc.Spec.PMM.URL, string(apiKey), skipVerifyTLS)
	if err != nil {
		return fmt.Errorf("failed to get PMM server version: %w", err)
	}

	return nil
}

// +kubebuilder:webhook:path=/mutate-monitoring-openeverest-io-v1alpha1-monitoringconfig,mutating=true,failurePolicy=fail,sideEffects=None,groups=monitoring.openeverest.io,resources=monitoringconfigs,verbs=create;update,versions=v1alpha1,name=mmonitoringconfig-v1alpha1.kb.io,admissionReviewVersions=v1

// MonitoringConfigCustomDefaulter struct is responsible for setting default values on the custom resource of the
// Kind MonitoringConfig when those are created or updated.
type MonitoringConfigCustomDefaulter struct{}

// Default implements webhook.CustomDefaulter so a webhook will be registered for the Kind MonitoringConfig.
func (d *MonitoringConfigCustomDefaulter) Default(ctx context.Context, obj *monitoringv1alpha1.MonitoringConfig) error {
	monitoringconfiglog.Info("Defaulting for MonitoringConfig", "name", obj.GetName())

	if obj.Spec.Type != monitoringv1alpha1.PMMMonitoringType {
		// Not PMM monitoring type, nothing to do.
		return nil
	}

	obj.Spec.SupportedProviders = []string{
		"provider-percona-server-mongodb",
		// Add other supported providers here.
	}

	obj.Spec.InstanceConstraints.RequiredFields = []string{
		".spec.components.monitoring.customSpec.monitoringConfigName",
	}

	return nil
}

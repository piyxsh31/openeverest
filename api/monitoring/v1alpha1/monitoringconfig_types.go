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

// Package v1alpha1 contains API Schema definitions for the monitoring v1alpha1 API group.
// +kubebuilder:object:generate=true
// +groupName=monitoring.openeverest.io
package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

const (
	// PMMMonitoringType represents monitoring via PMM.
	PMMMonitoringType MonitoringType = "pmm"
)

// MonitoringType is a type of monitoring.
type MonitoringType string

// PMMServerVersion is the version of the PMM server.
type PMMServerVersion string

// ProviderNameList is a type alias for a list of provider names.
type ProviderNameList []string

// MonitoringConfigInstanceConstraints defines compatibility requirements
// and prerequisites that must be satisfied by an Instance before this
// monitoring config can be used.
type MonitoringConfigInstanceConstraints struct {
	// RequiredFields contains a list of fields that must be set in the Instance spec.
	// Each key is a JSON path expressions that points to a field in the Instance spec.
	// For example, ".spec.components.monitoring.customSpec.monitoringConfigName".
	// +optional
	RequiredFields []string `json:"requiredFields,omitempty"`
}

// MonitoringConfigSpec defines the desired state of MonitoringConfig.
type MonitoringConfigSpec struct {
	// Type is the name of monitoring tool (e.g., "pmm").
	// +kubebuilder:validation:Enum=pmm
	Type MonitoringType `json:"type"`
	// CredentialsSecretName is the reference to the secret containing the API key.
	// It contains `apiKey` key with the API key value.
	CredentialsSecretName string `json:"credentialsSecretName"`
	// PMM is configuration specific for monitoring using PMM tool.
	PMM PMMConfig `json:"pmm,omitempty"`
	// VerifyTLS is set to ensure TLS/SSL verification.
	// If unspecified, the default value is true.
	//
	// +kubebuilder:default:=true
	VerifyTLS *bool `json:"verifyTLS,omitempty"`
	// SupportedProviders is the list of providers that supports monitoring config.
	SupportedProviders ProviderNameList `json:"supportedProviders,omitempty"`
	// InstanceConstraints defines compatibility requirements and prerequisites that must be satisfied by an Instance before this monitoring config can be used.
	// This allows the monitoring config to express specific requirements about the instance configuration needed for successful monitoring operations,
	// such as required instance fields, or other instance properties.
	// When an Instance references this monitoring config, the operator validates
	// the Instance against these constraints.
	// +optional
	InstanceConstraints MonitoringConfigInstanceConstraints `json:"instanceConstraints,omitempty"`
}

// PMMConfig is configuration of the PMM monitoring type.
type PMMConfig struct {
	// URL is url to the monitoring config.
	URL string `json:"url"`
}

// MonitoringConfigStatus defines the observed state of MonitoringConfig.
//
// FIXME: Add []metav1.Condition to represent the current state of the MonitoringConfig resource. Currently adding Conditions fails due to
// producing duplicated Go constants in generated code.
type MonitoringConfigStatus struct {
	// InUse is a flag that indicates if any Instance uses the monitoring config.
	// +kubebuilder:default=false
	InUse bool `json:"inUse,omitempty"`
	// LastObservedGeneration is the most recent generation observed for this MonitoringConfig.
	LastObservedGeneration int64 `json:"lastObservedGeneration,omitempty"`
	// PMMServerVersion shows PMM server version.
	PMMServerVersion PMMServerVersion `json:"pmmServerVersion,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Type",type="string",JSONPath=".spec.type",description="Monitoring tool type (e.g., pmm)"
// +kubebuilder:printcolumn:name="InUse",type="boolean",JSONPath=".status.inUse",description="Indicates if any Instance uses the monitoring config"

// MonitoringConfig is the Schema for the monitoringconfigs API.
type MonitoringConfig struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is a standard object metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitzero"`

	// spec defines the desired state of MonitoringConfig
	// +required
	Spec MonitoringConfigSpec `json:"spec"`

	// status defines the observed state of MonitoringConfig
	// +optional
	// +kubebuilder:default={"inUse": false}
	Status MonitoringConfigStatus `json:"status,omitzero"`
}

// +kubebuilder:object:root=true

// MonitoringConfigList contains a list of MonitoringConfig.
type MonitoringConfigList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitzero"`
	Items           []MonitoringConfig `json:"items"`
}

func init() {
	SchemeBuilder.Register(&MonitoringConfig{}, &MonitoringConfigList{})
}

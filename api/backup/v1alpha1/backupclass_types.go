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
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strings"

	"github.com/xeipuuv/gojsonschema"
	rbacv1 "k8s.io/api/rbac/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// BackupClassSpec defines the desired state of BackupClass
type BackupClassSpec struct { // DisplayName is a human-readable name for the backup class.
	DisplayName string `json:"displayName,omitempty"`
	// Description is the description of the backup class.
	Description string `json:"description,omitempty"`
	// SupportedProviders is the list of providers that the backup class supports.
	SupportedProviders ProviderNameList `json:"supportedProviders,omitempty"`
	// Config contains additional configuration defined for the backup class.
	Config BackupClassConfig `json:"config,omitempty"`
	// JobSpec is the specification of the backup job.
	// +optional
	JobSpec *BackupJobSpec `json:"jobSpec,omitempty"`
	// CleanupJobSpec is the specification of the cleanup job.
	// +optional
	CleanupJobSpec *BackupJobSpec `json:"cleanupJobSpec,omitempty"`
	// InstanceConstraints defines compatibility requirements and prerequisites that must be satisfied
	// by a Instance before this backup class can be used with it. This allows the backup class to
	// express specific requirements about the database configuration needed for successful backup operations,
	// such as required database fields, specific engine configurations, or other database properties.
	// When a Instance references this backup class, the operator will validate the Instance
	// against these constraints before proceeding with the backup operation.
	// +optional
	InstanceConstraints BackupClassInstanceConstraints `json:"instanceConstraints,omitempty"`
	// Permissions defines the permissions required by the backup class.
	// These permissions are used to generate a Role for the backup job.
	// +optional
	Permissions []rbacv1.PolicyRule `json:"permissions,omitempty"`
	// ClusterPermissions defines the cluster-wide permissions required by the backup class.
	// These permissions are used to generate a ClusterRole for the backup job.
	// +optional
	ClusterPermissions []rbacv1.PolicyRule `json:"clusterPermissions,omitempty"`

	// RestoreJobSpec is the specification of the restore job.
	// When set, this BackupClass supports restore operations.
	// +optional
	RestoreJobSpec *BackupJobSpec `json:"restoreJobSpec,omitempty"`
	// RestoreCleanupJobSpec is the specification of the restore cleanup job.
	// +optional
	RestoreCleanupJobSpec *BackupJobSpec `json:"restoreCleanupJobSpec,omitempty"`
	// RestoreConfig contains additional configuration defined for the restore operation.
	// +optional
	RestoreConfig BackupClassConfig `json:"restoreConfig,omitempty"`
	// RestorePermissions defines the permissions required by the restore job.
	// These permissions are used to generate a Role for the restore job.
	// +optional
	RestorePermissions []rbacv1.PolicyRule `json:"restorePermissions,omitempty"`
	// RestoreClusterPermissions defines the cluster-wide permissions required by the restore job.
	// These permissions are used to generate a ClusterRole for the restore job.
	// +optional
	RestoreClusterPermissions []rbacv1.PolicyRule `json:"restoreClusterPermissions,omitempty"`
}

// ProviderNameList is a type alias for a list of provider names.
type ProviderNameList []string

// Has checks if the list contains the specified provider.
func (e ProviderNameList) Has(provider string) bool {
	return slices.Contains(e, provider)
}

// BackupClassConfig contains additional configuration defined for the backup class.
type BackupClassConfig struct {
	// OpenAPIV3Schema is the OpenAPI v3 schema of the backup class.
	// +kubebuilder:pruning:PreserveUnknownFields
	// +kubebuilder:validation:Schemaless
	// +optional
	OpenAPIV3Schema *apiextensionsv1.JSONSchemaProps `json:"openAPIV3Schema,omitempty"`
}

// ErrSchemaValidationFailure is returned when the parameters do not conform to the BackupClass schema defined in .spec.config.
var ErrSchemaValidationFailure = errors.New("schema validation failed")

// Validate the config for the backup class.
func (cfg *BackupClassConfig) Validate(params *runtime.RawExtension) error {
	schema := cfg.OpenAPIV3Schema
	if schema == nil && params != nil {
		return ErrSchemaValidationFailure
	}
	if schema == nil && params == nil {
		return nil
	}

	// Additional properties are implicitly disallowed
	schema.AdditionalProperties = &apiextensionsv1.JSONSchemaPropsOrBool{
		Allows: false,
	}

	// Unmarshal the parameters into a generic map
	var paramsMap map[string]interface{}
	if err := json.Unmarshal(params.Raw, &paramsMap); err != nil {
		return fmt.Errorf("failed to unmarshal parameters: %w", err)
	}

	// Convert the OpenAPI v3 schema to a JSON schema validator
	schemaJSON, err := json.Marshal(schema)
	if err != nil {
		return fmt.Errorf("failed to marshal OpenAPI v3 schema: %w", err)
	}

	schemaLoader := gojsonschema.NewStringLoader(string(schemaJSON))
	paramsLoader := gojsonschema.NewGoLoader(paramsMap)

	// Validate the parameters against the schema
	result, err := gojsonschema.Validate(schemaLoader, paramsLoader)
	if err != nil {
		return fmt.Errorf("failed to validate parameters: %w", err)
	}

	if !result.Valid() {
		var validationErrors []string
		for _, err := range result.Errors() {
			validationErrors = append(validationErrors, err.String())
		}
		return errors.Join(ErrSchemaValidationFailure, fmt.Errorf("validation errors: %s", strings.Join(validationErrors, "; ")))
	}
	return nil
}

// BackupJobSpec defines the specification for the Kubernetes job.
type BackupJobSpec struct {
	// Image is the image of the backup class.
	Image string `json:"image,omitempty"`
	// Command is the command to run the backup class.
	// +optional
	Command []string `json:"command,omitempty"`
}

// BackupClassInstanceConstraints defines compatibility requirements and prerequisites
// that must be satisfied by a Instance before this backup class can be used with it.
type BackupClassInstanceConstraints struct {
	// RequiredFields contains a list of fields that must be set in the Instance spec.
	// Each key is a JSON path expressions that points to a field in the Instance spec.
	// For example, ".spec.engine.type" or ".spec.dataSource.dataImport.config.someField".
	// +optional
	RequiredFields []string `json:"requiredFields,omitempty"`
}

// BackupClassStatus defines the observed state of BackupClass.
type BackupClassStatus struct {
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:shortName=bc
// +kubebuilder:resource:scope=Cluster

// BackupClass is the Schema for the backupclasses API
type BackupClass struct {
	metav1.TypeMeta `json:",inline"`
	// +optional
	metav1.ObjectMeta `json:"metadata,omitzero"`

	// +required
	Spec BackupClassSpec `json:"spec"`
	// +optional
	Status BackupClassStatus `json:"status,omitzero"`
}

// +kubebuilder:object:root=true

// BackupClassList contains a list of BackupClass
type BackupClassList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitzero"`
	Items           []BackupClass `json:"items"`
}

func init() {
	SchemeBuilder.Register(&BackupClass{}, &BackupClassList{})
}

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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// RestoreSpec defines the desired state of Restore.
type RestoreSpec struct {
	// InstanceName is the name of the Instance to restore to.
	// The target Instance must use a provider listed in the BackupClass's SupportedProviders.
	// +kubebuilder:validation:Required
	InstanceName string `json:"instanceName,omitempty"`
	// DataSource defines where the backup data to restore from is located.
	// +kubebuilder:validation:Required
	DataSource RestoreDataSource `json:"dataSource"`
	// Config defines the configuration for the restore job.
	// These options are specific to the BackupClass being used and must conform to
	// the schema defined in the BackupClass's .spec.restoreConfig.openAPIV3Schema.
	// +kubebuilder:pruning:PreserveUnknownFields
	// +optional
	Config *runtime.RawExtension `json:"config,omitempty"`
}

// RestoreDataSource defines the source of the backup data for the restore operation.
// Exactly one of BackupName or External must be set.
type RestoreDataSource struct {
	// BackupName is the name of an existing Backup CR to restore from.
	// The BackupClass is resolved from the referenced Backup's backupClassName field.
	// +optional
	BackupName string `json:"backupName,omitempty"`
	// External defines an external backup source that does not have a corresponding Backup CR.
	// This is used for restoring from backups taken outside of OpenEverest.
	// +optional
	External *ExternalRestoreSource `json:"external,omitempty"`
	// PITR defines point-in-time recovery options.
	// When set, the restore job will attempt to recover the database to the specified point in time.
	// +optional
	PITR *PITR `json:"pitr,omitempty"`
}

// ExternalRestoreSource defines an external backup source for restore operations
// when no Backup CR exists in the cluster.
type ExternalRestoreSource struct {
	// BackupClassName is the name of the BackupClass that defines the restore job to use.
	// +kubebuilder:validation:Required
	BackupClassName string `json:"backupClassName,omitempty"`
	// Destination defines the location of the backup data to restore from.
	// +kubebuilder:validation:Required
	Destination *BackupDestination `json:"destination,omitempty"`
	// Config defines additional configuration for the external backup source.
	// +kubebuilder:pruning:PreserveUnknownFields
	// +optional
	Config *runtime.RawExtension `json:"config,omitempty"`
}

// PITRType defines the type of point-in-time recovery.
// +kubebuilder:validation:Enum=date;latest
type PITRType string

const (
	// PITRTypeDate indicates recovery to a specific date and time.
	PITRTypeDate PITRType = "date"
	// PITRTypeLatest indicates recovery to the latest available point in time.
	PITRTypeLatest PITRType = "latest"
)

// PITR defines point-in-time recovery configuration.
type PITR struct {
	// Type is the type of point-in-time recovery: "date" or "latest".
	// +kubebuilder:validation:Required
	Type PITRType `json:"type"`
	// Date is the target recovery point in time.
	// Required when Type is "date".
	// +optional
	Date *metav1.Time `json:"date,omitempty"`
}

// RestoreState is a type representing the state of a restore job.
type RestoreState string

const (
	// RestoreStatePending indicates that the restore job is pending.
	RestoreStatePending RestoreState = "Pending"
	// RestoreStateRunning indicates that the restore job is currently running.
	RestoreStateRunning RestoreState = "Running"
	// RestoreStateSucceeded indicates that the restore job has completed successfully.
	RestoreStateSucceeded RestoreState = "Succeeded"
	// RestoreStateFailed indicates that the restore job has failed.
	// Once the job is in this state, it cannot be retried.
	RestoreStateFailed RestoreState = "Failed"
	// RestoreStateError indicates that the restore job has encountered an error.
	// This state is used for transient errors that may allow the job to be retried.
	RestoreStateError RestoreState = "Error"
)

// RestoreStatus defines the observed state of Restore.
type RestoreStatus struct {
	// StartedAt is the time when the restore job started.
	StartedAt *metav1.Time `json:"startedAt,omitempty"`
	// CompletedAt is the time when the restore job completed successfully.
	CompletedAt *metav1.Time `json:"completedAt,omitempty"`
	// LastObservedGeneration is the last observed generation of the restore.
	LastObservedGeneration int64 `json:"lastObservedGeneration,omitempty"`
	// State is the current state of the restore job.
	State RestoreState `json:"state,omitempty"`
	// Message is a human-readable message about the restore job's current state.
	Message string `json:"message,omitempty"`
	// JobName is the reference to the job that is running the restore.
	// +optional
	JobName string `json:"jobName,omitempty"`
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:shortName=rs;rst
// +kubebuilder:printcolumn:name="TargetInstance",type="string",JSONPath=".spec.instanceName"
// +kubebuilder:printcolumn:name="State",type="string",JSONPath=".status.state"

// Restore is the Schema for the restores API
type Restore struct {
	metav1.TypeMeta `json:",inline"`
	// +optional
	metav1.ObjectMeta `json:"metadata,omitzero"`

	// +required
	Spec RestoreSpec `json:"spec"`
	// +optional
	Status RestoreStatus `json:"status,omitzero"`
}

// +kubebuilder:object:root=true

// RestoreList contains a list of Restore
type RestoreList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitzero"`
	Items           []Restore `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Restore{}, &RestoreList{})
}

package k8s

import (
	"context"

	backupv1alpha1 "github.com/openeverest/openeverest/v2/api/backup/v1alpha1"
)

// ListInstanceBackups returns backups for the specified instance.
func (h *k8sHandler) ListInstanceBackups(ctx context.Context, namespace, instance string) (*backupv1alpha1.BackupList, error) {
	return h.kubeConnector.ListInstanceBackups(ctx, namespace, instance)
}

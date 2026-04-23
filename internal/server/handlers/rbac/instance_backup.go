// Package rbac provides the RBAC handler.
package rbac

import (
	"context"

	backupv1alpha1 "github.com/openeverest/openeverest/v2/api/backup/v1alpha1"
)

// ListInstanceBackups proxies the request to the next handler.
func (h *rbacHandler) ListInstanceBackups(ctx context.Context, namespace, instance string) (*backupv1alpha1.BackupList, error) {
	// Add RBAC checks here if needed in the future
	return h.next.ListInstanceBackups(ctx, namespace, instance)
}

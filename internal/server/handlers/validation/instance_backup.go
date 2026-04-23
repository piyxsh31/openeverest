// Package validation provides the validation handler.
package validation

import (
	"context"

	"github.com/openeverest/openeverest/v2/api/backup/v1alpha1"
)

// ListInstanceBackups proxies the request to the next handler.
func (h *validateHandler) ListInstanceBackups(ctx context.Context, namespace, instance string) (*v1alpha1.BackupList, error) {
	return h.next.ListInstanceBackups(ctx, namespace, instance)
}

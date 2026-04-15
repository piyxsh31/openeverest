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

package monitoring

import (
	"encoding/json"
	"fmt"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	. "github.com/onsi/gomega/gstruct"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/utils/ptr"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	corev1alpha1 "github.com/openeverest/openeverest/v2/api/core/v1alpha1"
	monitoringv1alpha1 "github.com/openeverest/openeverest/v2/api/monitoring/v1alpha1"
)

const (
	timeout  = 30 * time.Second
	interval = 250 * time.Millisecond
)

// uniqueName returns a unique name for test isolation.
var testCounter int

func uniqueName(prefix string) string {
	testCounter++
	return fmt.Sprintf("%s-%d", prefix, testCounter)
}

// createNamespace creates a Namespace and returns its name.
func createNamespace() string {
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			GenerateName: "test-monitoring-",
		},
	}
	ExpectWithOffset(1, k8sClient.Create(ctx, ns)).To(Succeed())
	return ns.Name
}

// createCredentialsSecret creates the Secret referenced by a MonitoringConfig.
func createCredentialsSecret(namespace, name string) *corev1.Secret {
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Data: map[string][]byte{
			"apiKey": []byte("test-api-key"),
		},
	}
	ExpectWithOffset(1, k8sClient.Create(ctx, secret)).To(Succeed())
	return secret
}

// newMonitoringConfig returns a MonitoringConfig object pointing at the fake PMM server.
func newMonitoringConfig(namespace, name, secretName string) *monitoringv1alpha1.MonitoringConfig {
	return &monitoringv1alpha1.MonitoringConfig{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: monitoringv1alpha1.MonitoringConfigSpec{
			Type:                  monitoringv1alpha1.PMMMonitoringType,
			CredentialsSecretName: secretName,
			PMM: monitoringv1alpha1.PMMConfig{
				URL: pmmServer.URL,
			},
		},
	}
}

// newInstanceReferencingMC creates an Instance that references the given MonitoringConfig.
func newInstanceReferencingMC(namespace, name, mcName string) *corev1alpha1.Instance {
	customSpec, err := json.Marshal(map[string]any{
		"monitoringConfigName": mcName,
	})
	Expect(err).NotTo(HaveOccurred())

	return &corev1alpha1.Instance{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: corev1alpha1.InstanceSpec{
			Provider: "psmdb",
			Components: map[string]corev1alpha1.ComponentSpec{
				"monitoring": {
					CustomSpec: &runtime.RawExtension{Raw: customSpec},
				},
			},
		},
	}
}

// fetchMC is a helper that fetches the latest MonitoringConfig.
func fetchMC(namespace, name string) *monitoringv1alpha1.MonitoringConfig {
	mc := &monitoringv1alpha1.MonitoringConfig{}
	ExpectWithOffset(1, k8sClient.Get(ctx, types.NamespacedName{
		Name: name, Namespace: namespace,
	}, mc)).To(Succeed())
	return mc
}

// fetchSecret is a helper that fetches the latest Secret.
func fetchSecret(namespace, name string) *corev1.Secret {
	secret := &corev1.Secret{}
	ExpectWithOffset(1, k8sClient.Get(ctx, types.NamespacedName{
		Name: name, Namespace: namespace,
	}, secret)).To(Succeed())
	return secret
}

var _ = Describe("MonitoringConfig Controller", func() {
	Context("Create", func() {
		var (
			ns         string
			mcName     string
			secretName string
		)

		BeforeEach(func() {
			ns = createNamespace()
			mcName = uniqueName("mc-create")
			secretName = uniqueName("secret-create")
		})

		It("should reconcile a newly created MonitoringConfig and set owner reference on the Secret", func() {
			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("checking the Secret gets an owner reference pointing to the MonitoringConfig")
			Eventually(func(g Gomega) {
				s := fetchSecret(ns, secretName)
				ownerRef := metav1.GetControllerOf(s)
				g.Expect(ownerRef).NotTo(BeNil())
				g.Expect(ownerRef.Name).To(Equal(mcName))
				g.Expect(ownerRef.Kind).To(Equal("MonitoringConfig"))
			}, timeout, interval).Should(Succeed())

			By("checking that InUse is false (no Instance references it)")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.InUse).To(BeFalse())
			}, timeout, interval).Should(Succeed())

			By("checking that LastObservedGeneration is set")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.LastObservedGeneration).To(BeNumerically(">=", 1))
			}, timeout, interval).Should(Succeed())

			By("checking that PMMServerVersion is populated from the fake server")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(string(got.Status.PMMServerVersion)).To(Equal("3.0.0"))
			}, timeout, interval).Should(Succeed())
		})
	})

	Context("Read / Status", func() {
		It("should reflect status changes when an Instance starts referencing the MonitoringConfig", func() {
			ns := createNamespace()
			mcName := uniqueName("mc-read")
			secretName := uniqueName("secret-read")

			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("waiting for initial reconciliation with InUse=false")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.InUse).To(BeFalse())
				g.Expect(got.Status.LastObservedGeneration).To(BeNumerically(">=", 1))
			}, timeout, interval).Should(Succeed())

			By("creating an Instance referencing the MonitoringConfig")
			instance := newInstanceReferencingMC(ns, uniqueName("instance"), mcName)
			Expect(k8sClient.Create(ctx, instance)).To(Succeed())

			By("checking InUse becomes true")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.InUse).To(BeTrue())
			}, timeout, interval).Should(Succeed())
		})
	})

	Context("Update", func() {
		It("should re-reconcile when the MonitoringConfig spec is updated", func() {
			ns := createNamespace()
			mcName := uniqueName("mc-update")
			secretName := uniqueName("secret-update")
			newSecretName := uniqueName("secret-update-new")

			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("waiting for initial reconciliation")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.LastObservedGeneration).To(BeNumerically(">=", 1))
			}, timeout, interval).Should(Succeed())

			initialGen := fetchMC(ns, mcName).Status.LastObservedGeneration

			By("creating a new secret and updating the MonitoringConfig to reference it")
			createCredentialsSecret(ns, newSecretName)

			Eventually(func(g Gomega) {
				latest := fetchMC(ns, mcName)
				latest.Spec.CredentialsSecretName = newSecretName
				g.Expect(k8sClient.Update(ctx, latest)).To(Succeed())
			}, timeout, interval).Should(Succeed())

			By("checking that LastObservedGeneration increases after the update")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.LastObservedGeneration).To(BeNumerically(">", initialGen))
			}, timeout, interval).Should(Succeed())

			By("checking the new Secret gets the owner reference")
			Eventually(func(g Gomega) {
				s := fetchSecret(ns, newSecretName)
				ownerRef := metav1.GetControllerOf(s)
				g.Expect(ownerRef).NotTo(BeNil())
				g.Expect(ownerRef.Name).To(Equal(mcName))
			}, timeout, interval).Should(Succeed())
		})
	})

	Context("Delete", func() {
		It("should allow deletion when not in use", func() {
			ns := createNamespace()
			mcName := uniqueName("mc-delete")
			secretName := uniqueName("secret-delete")

			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("waiting for reconciliation to set owner reference on the Secret")
			Eventually(func(g Gomega) {
				s := fetchSecret(ns, secretName)
				g.Expect(metav1.GetControllerOf(s)).NotTo(BeNil())
			}, timeout, interval).Should(Succeed())

			By("deleting the MonitoringConfig")
			Expect(k8sClient.Delete(ctx, mc)).To(Succeed())

			By("checking the MonitoringConfig is removed")
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{
					Name: mcName, Namespace: ns,
				}, &monitoringv1alpha1.MonitoringConfig{})
				return apierrors.IsNotFound(err)
			}, timeout, interval).Should(BeTrue())
			// Note: owner-reference cascade GC is performed by kube-controller-manager,
			// which is not started by envtest. GC behaviour is verified in integration tests.
		})
	})

	Context("Finalizer", func() {
		It("should add the in-use finalizer when an Instance references the MonitoringConfig", func() {
			ns := createNamespace()
			mcName := uniqueName("mc-finalizer")
			secretName := uniqueName("secret-finalizer")

			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("initially there should be no in-use finalizer")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.LastObservedGeneration).To(BeNumerically(">=", 1))
				g.Expect(controllerutil.ContainsFinalizer(got, inUseFinalizer)).To(BeFalse())
			}, timeout, interval).Should(Succeed())

			By("creating an Instance that references the MonitoringConfig")
			instance := newInstanceReferencingMC(ns, uniqueName("inst-fin"), mcName)
			Expect(k8sClient.Create(ctx, instance)).To(Succeed())

			By("the in-use finalizer should be added")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(controllerutil.ContainsFinalizer(got, inUseFinalizer)).To(BeTrue())
				g.Expect(got.Status.InUse).To(BeTrue())
			}, timeout, interval).Should(Succeed())

			By("deletion should be blocked while the finalizer is present")
			Expect(k8sClient.Delete(ctx, fetchMC(ns, mcName))).To(Succeed())
			// The resource should still exist due to the finalizer.
			Consistently(func() error {
				return k8sClient.Get(ctx, types.NamespacedName{
					Name: mcName, Namespace: ns,
				}, &monitoringv1alpha1.MonitoringConfig{})
			}, 2*time.Second, interval).Should(Succeed())
		})

		It("should remove the in-use finalizer when the referencing Instance is deleted", func() {
			ns := createNamespace()
			mcName := uniqueName("mc-fin-remove")
			secretName := uniqueName("secret-fin-remove")
			instName := uniqueName("inst-fin-remove")

			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("creating an Instance and waiting for the finalizer to be added")
			instance := newInstanceReferencingMC(ns, instName, mcName)
			Expect(k8sClient.Create(ctx, instance)).To(Succeed())

			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(controllerutil.ContainsFinalizer(got, inUseFinalizer)).To(BeTrue())
			}, timeout, interval).Should(Succeed())

			By("deleting the Instance")
			Expect(k8sClient.Delete(ctx, instance)).To(Succeed())

			By("the in-use finalizer should be removed")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(controllerutil.ContainsFinalizer(got, inUseFinalizer)).To(BeFalse())
				g.Expect(got.Status.InUse).To(BeFalse())
			}, timeout, interval).Should(Succeed())
		})
	})

	Context("Owner reference cleanup", func() {
		It("should set controller owner reference only once (idempotent)", func() {
			ns := createNamespace()
			mcName := uniqueName("mc-owner-idem")
			secretName := uniqueName("secret-owner-idem")

			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("waiting for the controller to set the owner reference")
			Eventually(func(g Gomega) {
				s := fetchSecret(ns, secretName)
				g.Expect(metav1.GetControllerOf(s)).NotTo(BeNil())
			}, timeout, interval).Should(Succeed())

			By("recording the Secret's resourceVersion")
			secretRV := fetchSecret(ns, secretName).ResourceVersion

			By("triggering another reconciliation by touching the MonitoringConfig")
			Eventually(func(g Gomega) {
				latest := fetchMC(ns, mcName)
				if latest.Annotations == nil {
					latest.Annotations = map[string]string{}
				}
				latest.Annotations["test"] = "trigger-requeue"
				g.Expect(k8sClient.Update(ctx, latest)).To(Succeed())
			}, timeout, interval).Should(Succeed())

			By("waiting for reconciliation to complete")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.LastObservedGeneration).To(Equal(got.Generation))
			}, timeout, interval).Should(Succeed())

			By("checking the Secret's resourceVersion has NOT changed (no duplicate update)")
			Expect(fetchSecret(ns, secretName).ResourceVersion).To(Equal(secretRV))
		})

		It("should set the Secret owner reference pointing to the MonitoringConfig UID", func() {
			// Owner-reference cascade GC (deletion of Secret when MC is deleted) is performed
			// by kube-controller-manager, which is NOT started by envtest. This test verifies
			// that the owner reference is correctly written so GC would fire in a real cluster.
			ns := createNamespace()
			mcName := uniqueName("mc-gc")
			secretName := uniqueName("secret-gc")

			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("waiting for owner reference to be set")
			var mcUID types.UID
			Eventually(func(g Gomega) {
				s := fetchSecret(ns, secretName)
				ownerRef := metav1.GetControllerOf(s)
				g.Expect(ownerRef).NotTo(BeNil())
				g.Expect(ownerRef.Name).To(Equal(mcName))
				g.Expect(ownerRef.Kind).To(Equal("MonitoringConfig"))
				g.Expect(ownerRef.UID).NotTo(BeEmpty())
				mcUID = ownerRef.UID
			}, timeout, interval).Should(Succeed())

			By("verifying the owner UID matches the actual MonitoringConfig UID")
			Expect(fetchMC(ns, mcName).UID).To(Equal(mcUID))
		})

		It("should not set owner reference on a Secret that already has a controller owner", func() {
			ns := createNamespace()
			mcName := uniqueName("mc-no-owner")
			secretName := uniqueName("secret-no-owner")

			By("creating a Secret with a pre-existing controller owner")
			secret := &corev1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      secretName,
					Namespace: ns,
					OwnerReferences: []metav1.OwnerReference{
						{
							APIVersion:         "v1",
							Kind:               "ConfigMap",
							Name:               "some-other-owner",
							UID:                "00000000-0000-0000-0000-000000000001",
							Controller:         ptr.To(true),
							BlockOwnerDeletion: ptr.To(true),
						},
					},
				},
				Data: map[string][]byte{
					"apiKey": []byte("test-api-key"),
				},
			}
			Expect(k8sClient.Create(ctx, secret)).To(Succeed())

			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("waiting for reconciliation to process")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(got.Status.LastObservedGeneration).To(BeNumerically(">=", 1))
			}, timeout, interval).Should(Succeed())

			By("checking the Secret still has the original controller owner, not the MonitoringConfig")
			s := fetchSecret(ns, secretName)
			ownerRef := metav1.GetControllerOf(s)
			Expect(ownerRef).NotTo(BeNil())
			Expect(ownerRef.Name).To(Equal("some-other-owner"))
			Expect(ownerRef.Kind).To(Equal("ConfigMap"))

			// Verify the MonitoringConfig is NOT listed as a controller owner.
			for _, ref := range s.OwnerReferences {
				if ref.Kind == "MonitoringConfig" {
					Expect(ref.Controller).To(SatisfyAny(BeNil(), PointTo(BeFalse())))
				}
			}
		})
	})

	Context("Multiple Instances", func() {
		It("should keep the finalizer while at least one Instance references the MonitoringConfig", func() {
			ns := createNamespace()
			mcName := uniqueName("mc-multi")
			secretName := uniqueName("secret-multi")

			createCredentialsSecret(ns, secretName)
			mc := newMonitoringConfig(ns, mcName, secretName)
			Expect(k8sClient.Create(ctx, mc)).To(Succeed())

			By("creating two Instances referencing the MonitoringConfig")
			inst1 := newInstanceReferencingMC(ns, uniqueName("inst-multi-1"), mcName)
			inst2 := newInstanceReferencingMC(ns, uniqueName("inst-multi-2"), mcName)
			Expect(k8sClient.Create(ctx, inst1)).To(Succeed())
			Expect(k8sClient.Create(ctx, inst2)).To(Succeed())

			By("waiting for finalizer to be added")
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(controllerutil.ContainsFinalizer(got, inUseFinalizer)).To(BeTrue())
				g.Expect(got.Status.InUse).To(BeTrue())
			}, timeout, interval).Should(Succeed())

			By("deleting the first Instance — finalizer should remain")
			Expect(k8sClient.Delete(ctx, inst1)).To(Succeed())
			Consistently(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(controllerutil.ContainsFinalizer(got, inUseFinalizer)).To(BeTrue())
				g.Expect(got.Status.InUse).To(BeTrue())
			}, 2*time.Second, interval).Should(Succeed())

			By("deleting the second Instance — finalizer should be removed")
			Expect(k8sClient.Delete(ctx, inst2)).To(Succeed())
			Eventually(func(g Gomega) {
				got := fetchMC(ns, mcName)
				g.Expect(controllerutil.ContainsFinalizer(got, inUseFinalizer)).To(BeFalse())
				g.Expect(got.Status.InUse).To(BeFalse())
			}, timeout, interval).Should(Succeed())
		})
	})
})

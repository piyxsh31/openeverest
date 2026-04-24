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

import {test as setup, expect} from '@playwright/test';
import {
  waitForAuthentik,
  bootstrapAuthentik,
  configureAuthentik,
  authentikLogin,
  grantSSOUserAdmin,
  AUTHENTIK_IN_CLUSTER_URL,
} from '@tests/utils/authentik';
import {
  AUTHENTIK_URL,
  API_SSO_AUTHENTIK_TOKEN,
} from '@root/constants';
import {CliHelper} from '@helpers/cliHelper';

// OIDC config using the in-cluster Authentik URL so Everest backend can reach it.
// Authentik's OIDC discovery is at /application/o/<slug>/.well-known/openid-configuration
const buildOIDCConfigYAML = (clientId: string, slug: string) =>
  `issuerUrl: ${AUTHENTIK_IN_CLUSTER_URL}/application/o/${slug}/\nclientId: ${clientId}\nscopes:\n    - openid\n    - profile\n    - email`;

setup.describe.serial('Authentik SSO setup', () => {
  const cli = new CliHelper();

  setup('Wait for Authentik readiness', async ({request}) => {
    await waitForAuthentik(request, AUTHENTIK_URL);
  });

  setup('Bootstrap Authentik admin credentials and API token', async ({request}) => {
    await bootstrapAuthentik(request, AUTHENTIK_URL);
  });

  setup('Configure Authentik provider, application, and user', async ({request}) => {
    const everestURL = process.env.EVEREST_URL || 'http://localhost:8080';
    const config = await configureAuthentik(request, AUTHENTIK_URL, everestURL);

    // Store config in env for subsequent steps
    process.env.AUTHENTIK_CLIENT_ID = config.clientId;
    process.env.AUTHENTIK_APP_SLUG = config.slug;
    process.env.AUTHENTIK_SSO_USER = config.username;
    process.env.AUTHENTIK_SSO_PASSWORD = config.password;
  });

  setup('Configure Everest OIDC settings via ConfigMap', async () => {
    const clientId = process.env.AUTHENTIK_CLIENT_ID;
    const slug = process.env.AUTHENTIK_APP_SLUG;
    expect(clientId, 'AUTHENTIK_CLIENT_ID must be set').toBeTruthy();
    expect(slug, 'AUTHENTIK_APP_SLUG must be set').toBeTruthy();

    // Patch the ConfigMap directly
    const oidcYAML = buildOIDCConfigYAML(clientId!, slug!);
    const patch = JSON.stringify({data: {'oidc.config': oidcYAML}});
    const patchResult = await cli.execute(
      `kubectl patch configmap everest-settings -n everest-system --type merge -p '${patch}'`,
    );
    expect(patchResult.code, `ConfigMap patch failed: ${patchResult.stderr}`).toEqual(0);

    // Restart Everest so it picks up the new OIDC config.
    const restartResult = await cli.execute(
      'kubectl rollout restart deployment/everest-server -n everest-system',
    );
    expect(restartResult.code, `Restart failed: ${restartResult.stderr}`).toEqual(0);

    // Wait for Everest to be ready again.
    const waitResult = await cli.execute(
      'kubectl rollout status deployment/everest-server -n everest-system --timeout=120s',
    );
    expect(waitResult.code, `Everest did not become ready: ${waitResult.stderr}`).toEqual(0);
  });

  setup('Wait for Everest API to be reachable', async ({request}) => {
    const everestURL = process.env.EVEREST_URL || 'http://localhost:8080';
    const timeoutMs = 60_000;
    const start = Date.now();
    let reachable = false;

    while (Date.now() - start < timeoutMs) {
      try {
        await request.get(`${everestURL}/v1/version`);
        reachable = true;
        break;
      } catch {
        // port-forward not yet connected
      }

      // After 10s, start our own port-forward as a fallback
      if (Date.now() - start > 10_000) {
        try {
          const {exec} = await import('child_process');
          exec('kubectl port-forward -n everest-system svc/everest 8080:8080');
        } catch { /* ignore if already running */ }
      }

      await new Promise((r) => setTimeout(r, 1_000));
    }
    expect(reachable, `Everest API at ${everestURL} did not become reachable within ${timeoutMs}ms`).toBeTruthy();
  });

  setup('Login via Authentik and obtain SSO token', async ({page, request}) => {
    const clientId = process.env.AUTHENTIK_CLIENT_ID!;
    const redirectUri = `${process.env.EVEREST_URL || 'http://localhost:8080'}/login/callback`;
    const tokens = await authentikLogin(page, request, AUTHENTIK_URL, clientId, redirectUri);

    // Store the access token — will be exchanged via POST /v1/session/sso
    // during tests to obtain an Everest-signed JWT.
    process.env[API_SSO_AUTHENTIK_TOKEN] = tokens.access_token;
  });

  setup('Grant SSO user admin RBAC role', async () => {
    await grantSSOUserAdmin('sso-test-user');
  });
});

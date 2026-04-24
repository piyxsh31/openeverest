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

import {APIRequestContext, expect} from '@playwright/test';

const AUTHENTIK_ADMIN_USERNAME = 'akadmin';
const AUTHENTIK_ADMIN_PASSWORD = 'admin';
const AUTHENTIK_APP_SLUG = 'everest-app';
const AUTHENTIK_TEST_USER = 'sso-test-user';
const AUTHENTIK_TEST_PASSWORD = 'sso-test-password';

// In-cluster Authentik service URL — used as the OIDC issuer configured in Everest,
// so the Everest backend pod can reach Authentik for UserInfo/JWKS calls.
export const AUTHENTIK_IN_CLUSTER_URL =
  'http://authentik.everest-system.svc.cluster.local:9000';

// Module-level API token, populated by bootstrapAuthentik().
let authentikAdminToken = '';

export interface AuthentikConfig {
  issuerURL: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  baseURL: string;
  slug: string;
}

/**
 * Helper to call Authentik Admin API v3 using the API token obtained
 * during bootstrap.
 */
const adminApi = async (
  request: APIRequestContext,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  authentikBaseURL: string,
  path: string,
  data?: Record<string, unknown>,
) => {
  const url = `${authentikBaseURL}/api/v3${path}`;
  const headers = {
    Authorization: `Bearer ${authentikAdminToken}`,
  };
  const resp = await request[method](url, {
    headers,
    ...(data ? {data} : {}),
  });
  return resp;
};

/**
 * Wait for Authentik to be ready by polling the health endpoint.
 */
export const waitForAuthentik = async (
  request: APIRequestContext,
  authentikBaseURL: string,
  timeoutMs = 180_000,
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await request.get(
        `${authentikBaseURL}/-/health/ready/`,
      );
      if (resp.ok()) return;
    } catch {
      // Authentik not ready yet
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Authentik did not become ready within ${timeoutMs}ms`);
};

/**
 * Complete Authentik's one-time initial-setup flow to set the admin password,
 * then authenticate and create a long-lived API token.
 *
 * Authentik 2026.x does NOT honour AUTHENTIK_BOOTSTRAP_PASSWORD — the admin
 * account is created with an unusable password until the initial-setup flow
 * has been completed at least once.
 */
export const bootstrapAuthentik = async (
  request: APIRequestContext,
  authentikBaseURL: string,
): Promise<void> => {
  const flowURL = `${authentikBaseURL}/api/v3/flows/executor/initial-setup/`;

  // 1. Try the initial-setup flow.  If AUTHENTIK_BOOTSTRAP_PASSWORD worked
  //    (PostgreSQL was ready before the server started), the flow will return
  //    "ak-stage-access-denied" — that is fine, the password is already set.
  //    Otherwise it returns "ak-stage-prompt" and we complete it.
  const getResp = await request.get(flowURL);
  const stage = await getResp.json();

  if (stage.component === 'ak-stage-prompt') {
    // Complete the prompt stage with admin email + password.
    await request.post(flowURL, {
      data: {
        email: 'admin@example.com',
        password: AUTHENTIK_ADMIN_PASSWORD,
        password_repeat: AUTHENTIK_ADMIN_PASSWORD,
      },
    });
    // Follow redirect to complete the flow.
    await request.get(flowURL);
  }
  // If component is "ak-stage-access-denied" or "xak-flow-redirect", the
  // password was already set by AUTHENTIK_BOOTSTRAP_PASSWORD — move on.

  // 2. Authenticate through the default login flow to get a session.
  const loginFlowURL = `${authentikBaseURL}/api/v3/flows/executor/default-authentication-flow/`;

  // GET the flow to receive the identification stage.
  await request.get(loginFlowURL);

  // POST identification.
  await request.post(loginFlowURL, {
    data: {
      component: 'ak-stage-identification',
      uid_field: AUTHENTIK_ADMIN_USERNAME,
    },
  });

  // POST password.
  const pwResp = await request.post(loginFlowURL, {
    data: {
      component: 'ak-stage-password',
      password: AUTHENTIK_ADMIN_PASSWORD,
    },
  });

  // Authentik may return an empty redirect body, then the user-login stage.
  // Follow through until we get an authenticated session.
  if (pwResp.status() === 302 || (await pwResp.text()).length === 0) {
    await request.get(loginFlowURL);
  }

  // 3. Create a non-expiring API token via the admin endpoint.
  //    The session cookies from the login flow authenticate us.
  const csrfResp = await request.get(
    `${authentikBaseURL}/api/v3/core/tokens/`,
  );
  expect(csrfResp.ok(), 'Session not authenticated after login flow').toBeTruthy();

  // Extract the CSRF token from the Set-Cookie header.
  const cookies = await request.storageState();
  const csrfCookie = cookies.cookies.find(c => c.name === 'authentik_csrf');

  const tokenResp = await request.post(
    `${authentikBaseURL}/api/v3/core/tokens/`,
    {
      headers: {
        ...(csrfCookie ? {'X-authentik-CSRF': csrfCookie.value} : {}),
      },
      data: {
        identifier: 'everest-test-api-token',
        intent: 'api',
        expiring: false,
      },
    },
  );
  expect(
    tokenResp.ok(),
    `Failed to create API token: ${tokenResp.status()} — ${await tokenResp.text()}`,
  ).toBeTruthy();

  // 4. Retrieve the actual token key.
  const keyResp = await request.get(
    `${authentikBaseURL}/api/v3/core/tokens/everest-test-api-token/view_key/`,
    {
      headers: {
        ...(csrfCookie ? {'X-authentik-CSRF': csrfCookie.value} : {}),
      },
    },
  );
  expect(keyResp.ok(), 'Failed to retrieve API token key').toBeTruthy();
  const {key} = await keyResp.json();

  authentikAdminToken = key;
};

/**
 * Get the list of existing OAuth2 providers to find one by name.
 */
const findOAuth2Provider = async (
  request: APIRequestContext,
  authentikBaseURL: string,
  name: string,
): Promise<{pk: number} | null> => {
  const resp = await adminApi(request, 'get', authentikBaseURL,
    `/providers/oauth2/?search=${encodeURIComponent(name)}`);
  if (!resp.ok()) return null;
  const body = await resp.json();
  const match = body.results?.find((p: {name: string}) => p.name === name);
  return match ? {pk: match.pk} : null;
};

/**
 * Get the list of existing applications to find one by slug.
 */
const findApplication = async (
  request: APIRequestContext,
  authentikBaseURL: string,
  slug: string,
): Promise<boolean> => {
  const resp = await adminApi(request, 'get', authentikBaseURL,
    `/core/applications/?slug=${encodeURIComponent(slug)}`);
  if (!resp.ok()) return false;
  const body = await resp.json();
  return body.results?.some((a: {slug: string}) => a.slug === slug) ?? false;
};

/**
 * Get flow PK by designation.
 */
const getFlowByDesignation = async (
  request: APIRequestContext,
  authentikBaseURL: string,
  designation: string,
): Promise<string | null> => {
  const resp = await adminApi(request, 'get', authentikBaseURL,
    `/flows/instances/?designation=${designation}&ordering=slug`);
  if (!resp.ok()) return null;
  const body = await resp.json();
  if (body.results?.length > 0) {
    return body.results[0].pk;
  }
  return null;
};

/**
 * Look up built-in OIDC scope property mappings by managed identifiers.
 */
const getOIDCScopeMappings = async (
  request: APIRequestContext,
  authentikBaseURL: string,
): Promise<string[]> => {
  const wanted = [
    'goauthentik.io/providers/oauth2/scope-openid',
    'goauthentik.io/providers/oauth2/scope-profile',
    'goauthentik.io/providers/oauth2/scope-email',
    'goauthentik.io/providers/oauth2/scope-offline_access',
  ];
  const resp = await adminApi(request, 'get', authentikBaseURL,
    '/propertymappings/all/?managed__startswith=goauthentik.io/providers/oauth2/scope&page_size=20');
  if (!resp.ok()) return [];
  const body = await resp.json();
  return body.results
    .filter((r: {managed: string}) => wanted.includes(r.managed))
    .map((r: {pk: string}) => r.pk);
};

/**
 * Configure Authentik with an OAuth2 provider, application, and test user.
 * Returns the configuration needed for Everest OIDC setup and SSO tests.
 *
 * Key difference from Keycloak: Authentik issues **opaque** access tokens by default.
 * This is the exact scenario that broke Everest in Issue #1904.
 */
export const configureAuthentik = async (
  request: APIRequestContext,
  authentikBaseURL: string,
  everestURL: string,
): Promise<AuthentikConfig> => {
  // 1. Look up required flows
  const authFlowPk = await getFlowByDesignation(request, authentikBaseURL, 'authorization');
  expect(authFlowPk, 'Could not find a default authorization flow').toBeTruthy();

  const invalidationFlowPk = await getFlowByDesignation(request, authentikBaseURL, 'invalidation');
  expect(invalidationFlowPk, 'Could not find a default invalidation flow').toBeTruthy();

  // The authentication flow enables ROPC (password grant) — needed for tests.
  const authenticationFlowPk = await getFlowByDesignation(request, authentikBaseURL, 'authentication');
  expect(authenticationFlowPk, 'Could not find a default authentication flow').toBeTruthy();

  // 2. Look up OIDC scope mappings
  const scopeMappings = await getOIDCScopeMappings(request, authentikBaseURL);

  // 3. Create an OAuth2 Provider (or find existing)
  let providerPk: number;
  const existing = await findOAuth2Provider(request, authentikBaseURL, 'everest-provider');
  if (existing) {
    providerPk = existing.pk;
  } else {
    const providerResp = await adminApi(request, 'post', authentikBaseURL,
      '/providers/oauth2/', {
        name: 'everest-provider',
        authorization_flow: authFlowPk,
        invalidation_flow: invalidationFlowPk,
        // authentication_flow enables ROPC (grant_type=password) for the token endpoint
        authentication_flow: authenticationFlowPk,
        client_type: 'public',
        // Authentik 2026.x requires redirect_uris as a list of objects
        redirect_uris: [{matching_mode: 'regex', url: `${everestURL}/.*`}],
        property_mappings: scopeMappings,
      });
    const providerBody = await providerResp.text();
    expect(
      providerResp.ok(),
      `Failed to create OAuth2 provider: ${providerResp.status()} — ${providerBody}`,
    ).toBeTruthy();
    const parsed = JSON.parse(providerBody);
    providerPk = parsed.pk;
  }

  // 4. Create an Application linked to the provider (or skip if exists)
  const appExists = await findApplication(request, authentikBaseURL, AUTHENTIK_APP_SLUG);
  if (!appExists) {
    const appResp = await adminApi(request, 'post', authentikBaseURL,
      '/core/applications/', {
        name: 'Everest App',
        slug: AUTHENTIK_APP_SLUG,
        provider: providerPk,
        policy_engine_mode: 'any',
      });
    const appBody = await appResp.text();
    expect(
      appResp.ok(),
      `Failed to create application: ${appResp.status()} — ${appBody}`,
    ).toBeTruthy();
  }

  // 5. Create a test user
  let userId: number | undefined;
  const userSearchResp = await adminApi(request, 'get', authentikBaseURL,
    `/core/users/?search=${AUTHENTIK_TEST_USER}`);
  if (userSearchResp.ok()) {
    const userSearchBody = await userSearchResp.json();
    const existingUser = userSearchBody.results?.find(
      (u: {username: string}) => u.username === AUTHENTIK_TEST_USER,
    );
    if (existingUser) {
      userId = existingUser.pk;
    }
  }

  if (!userId) {
    const userResp = await adminApi(request, 'post', authentikBaseURL,
      '/core/users/', {
        username: AUTHENTIK_TEST_USER,
        name: 'SSO Test User',
        email: `${AUTHENTIK_TEST_USER}@example.com`,
        is_active: true,
      });
    const userBody = await userResp.text();
    expect(
      userResp.ok(),
      `Failed to create user: ${userResp.status()} — ${userBody}`,
    ).toBeTruthy();
    userId = JSON.parse(userBody).pk;
  }

  // 6. Set the user's password
  const pwResp = await adminApi(request, 'post', authentikBaseURL,
    `/core/users/${userId}/set_password/`, {
      password: AUTHENTIK_TEST_PASSWORD,
    });
  expect(
    pwResp.ok(),
    `Failed to set user password: ${pwResp.status()}`,
  ).toBeTruthy();

  // 7. Get the client_id from the provider
  const providerDetailResp = await adminApi(request, 'get', authentikBaseURL,
    `/providers/oauth2/${providerPk}/`);
  expect(providerDetailResp.ok()).toBeTruthy();
  const providerDetail = await providerDetailResp.json();

  return {
    issuerURL: `${authentikBaseURL}/application/o/${AUTHENTIK_APP_SLUG}/`,
    clientId: providerDetail.client_id,
    clientSecret: providerDetail.client_secret || '',
    username: AUTHENTIK_TEST_USER,
    password: AUTHENTIK_TEST_PASSWORD,
    baseURL: authentikBaseURL,
    slug: AUTHENTIK_APP_SLUG,
  };
};

/**
 * Perform OIDC Resource Owner Password Credentials login against Authentik.
 *
 * IMPORTANT: Authentik issues **opaque** (non-JWT) access tokens by default.
 * This is the exact behavior that caused Issue #1904 — Everest's echojwt
 * middleware cannot parse opaque tokens as JWT.
 */
export const authentikLogin = async (
  request: APIRequestContext,
  authentikBaseURL: string,
  clientId: string,
  username?: string,
  password?: string,
): Promise<{access_token: string; id_token: string; refresh_token: string}> => {
  const tokenURL = `${authentikBaseURL}/application/o/token/`;
  const resp = await request.post(tokenURL, {
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    form: {
      grant_type: 'password',
      client_id: clientId,
      username: username ?? AUTHENTIK_TEST_USER,
      password: password ?? AUTHENTIK_TEST_PASSWORD,
      scope: 'openid profile email',
    },
  });
  const body = await resp.text();
  expect(
    resp.ok(),
    `Authentik login failed: HTTP ${resp.status()} — ${body}`,
  ).toBeTruthy();
  return JSON.parse(body);
};

/**
 * Add the SSO test user to the Everest admin RBAC role.
 */
export const grantSSOUserAdmin = async (
  ssoSubject: string,
): Promise<void> => {
  const {execSync} = await import('child_process');
  execSync(
    `kubectl patch configmap everest-rbac -n everest-system --type merge -p "$(kubectl get configmap everest-rbac -n everest-system -o json | jq '{data: { "policy.csv": (.data["policy.csv"] + "\\ng, ${ssoSubject}, role:admin") } }')"`,
    {stdio: 'pipe'},
  );
};

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

import {APIRequestContext, expect, Page} from '@playwright/test';
import {createHash, randomBytes, randomUUID} from 'crypto';

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
  const {execSync} = await import('child_process');
  const {randomUUID} = await import('crypto');

  // 1. Complete initial-setup flow if needed.
  //    If AUTHENTIK_BOOTSTRAP_PASSWORD worked, the flow returns
  //    "ak-stage-access-denied" and we skip it.
  //    Otherwise we set the admin password via the prompt stage.
  const flowURL = `${authentikBaseURL}/api/v3/flows/executor/initial-setup/`;
  const getResp = await request.get(flowURL);
  const stage = await getResp.json();

  if (stage.component === 'ak-stage-prompt') {
    await request.post(flowURL, {
      data: {
        email: 'admin@example.com',
        password: AUTHENTIK_ADMIN_PASSWORD,
        password_repeat: AUTHENTIK_ADMIN_PASSWORD,
      },
    });
    await request.get(flowURL);
  }

  // 2. Create a non-expiring API token directly in the database.
  //    This avoids the fragile flow-based session auth + CSRF dance
  //    that Playwright's APIRequestContext doesn't handle reliably.
  const tokenKey = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  const tokenUUID = randomUUID();
  const sql = `INSERT INTO authentik_core_token (token_uuid, identifier, key, intent, expiring, description, managed, user_id) SELECT '${tokenUUID}', 'everest-test-api-token', '${tokenKey}', 'api', false, 'Auto-created for tests', NULL, id FROM authentik_core_user WHERE username = '${AUTHENTIK_ADMIN_USERNAME}' ON CONFLICT (identifier) DO UPDATE SET key = '${tokenKey}'`;

  execSync(
    `kubectl exec -n everest-system deploy/authentik-postgresql -- psql -U authentik -d authentik -c "${sql}"`,
    {stdio: 'pipe'},
  );

  // 3. Verify the token works
  const verifyResp = await request.get(
    `${authentikBaseURL}/api/v3/core/users/?page_size=1`,
    {headers: {Authorization: `Bearer ${tokenKey}`}},
  );
  expect(
    verifyResp.ok(),
    `Bootstrap API token rejected: ${verifyResp.status()}`,
  ).toBeTruthy();

  authentikAdminToken = tokenKey;
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
  // Use _implicit_ consent so the browser-based auth code flow
  // doesn't pause for user consent — the test user auto-consents.
  const authFlowResp = await adminApi(request, 'get', authentikBaseURL,
    '/flows/instances/?designation=authorization&ordering=slug');
  expect(authFlowResp.ok()).toBeTruthy();
  const authFlows = (await authFlowResp.json()).results ?? [];
  const implicitFlow = authFlows.find(
    (f: {slug: string}) => f.slug.includes('implicit'),
  );
  const authFlowPk = implicitFlow?.pk ?? authFlows[0]?.pk;
  expect(authFlowPk, 'Could not find an authorization flow').toBeTruthy();

  const invalidationFlowPk = await getFlowByDesignation(request, authentikBaseURL, 'invalidation');
  expect(invalidationFlowPk, 'Could not find a default invalidation flow').toBeTruthy();

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
 * Perform OIDC Authorization Code flow via browser automation.
 *
 * Unlike Keycloak, Authentik issues **opaque** access tokens from the
 * authorization code flow.  The M2M/client_credentials grant returns JWTs,
 * so we MUST use the browser-based auth code flow to get a real opaque token
 * — which is the exact scenario that caused Issue #1904.
 */
export const authentikLogin = async (
  page: Page,
  request: APIRequestContext,
  authentikBaseURL: string,
  clientId: string,
  redirectUri: string,
  username?: string,
  password?: string,
): Promise<{access_token: string; id_token: string; refresh_token: string}> => {
  const user = username ?? AUTHENTIK_TEST_USER;
  const pass = password ?? AUTHENTIK_TEST_PASSWORD;

  // Generate PKCE pair (required for public client)
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const state = randomUUID();

  // Build authorization URL
  const authorizeURL = new URL(`${authentikBaseURL}/application/o/authorize/`);
  authorizeURL.searchParams.set('client_id', clientId);
  authorizeURL.searchParams.set('response_type', 'code');
  authorizeURL.searchParams.set('redirect_uri', redirectUri);
  authorizeURL.searchParams.set('scope', 'openid profile email');
  authorizeURL.searchParams.set('state', state);
  authorizeURL.searchParams.set('code_challenge', codeChallenge);
  authorizeURL.searchParams.set('code_challenge_method', 'S256');

  // Navigate — Authentik will show the login form, then redirect to redirect_uri
  await page.goto(authorizeURL.toString());

  // Fill the identification stage
  await page.locator('[name="uidField"]').fill(user);
  await page.locator('button[type="submit"]').click();

  // Authentik transitions between flow stages via page reload/re-render.
  // Wait for the password field to be stable before filling it — otherwise
  // we could fill a transient element that gets replaced during the transition.
  await page.waitForLoadState('networkidle');
  const passwordInput = page.locator('[name="password"]');
  await passwordInput.waitFor({state: 'visible', timeout: 10_000});
  await passwordInput.fill(pass);

  // Intercept the OAuth callback redirect: fulfill with 200 so the browser
  // doesn't hang trying to connect to localhost:8080 (frontend not running).
  await page.route(
    url => url.toString().startsWith(redirectUri),
    route => route.fulfill({status: 200, contentType: 'text/html', body: '<html><body>OK</body></html>'}),
    {times: 1},
  );

  const callbackReqPromise = page.waitForRequest(
    req => req.url().startsWith(redirectUri),
    {timeout: 30_000},
  );

  // Submit the password stage
  await page.locator('button[type="submit"]').click();

  // After password, Authentik may show a consent page (if the authorization
  // flow is not "implicit consent").  Wait for the page to settle, then click
  // through any consent form that appears.
  await page.waitForLoadState('networkidle').catch(() => {});
  const stillOnPasswordPage = await passwordInput.isVisible().catch(() => false);
  if (!stillOnPasswordPage) {
    const consentBtn = page.locator('button[type="submit"]');
    if (await consentBtn.isVisible().catch(() => false)) {
      await consentBtn.click();
    }
  }

  const callbackReq = await callbackReqPromise;

  // Extract the authorization code from the callback URL
  const finalURL = new URL(callbackReq.url());
  const code = finalURL.searchParams.get('code');
  expect(code, `Authorization code not found in URL: ${page.url()}`).toBeTruthy();
  expect(finalURL.searchParams.get('state')).toEqual(state);

  // Exchange the code for tokens at the token endpoint
  const tokenResp = await request.post(
    `${authentikBaseURL}/application/o/token/`,
    {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      form: {
        grant_type: 'authorization_code',
        code: code!,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      },
    },
  );
  const body = await tokenResp.text();
  expect(
    tokenResp.ok(),
    `Authentik token exchange failed: HTTP ${tokenResp.status()} — ${body}`,
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

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

import {expect, test} from '@playwright/test';
import {authentikLogin} from '@tests/utils/authentik';
import {AUTHENTIK_URL, API_SSO_AUTHENTIK_TOKEN} from '@root/constants';

test.describe('SSO with Authentik (opaque tokens)', () => {
  test('OIDC settings are configured', async ({request}) => {
    const resp = await request.get('/v1/settings');
    expect(resp.ok()).toBeTruthy();

    const settings = await resp.json();
    expect(settings.oidcConfig).toBeDefined();
    expect(settings.oidcConfig.issuerURL).toContain('/application/o/');
    expect(settings.oidcConfig.clientId).toBeTruthy();
  });

  test('Authentik access token is opaque (not a JWT)', async () => {
    // Verify the fundamental assumption: Authentik issues opaque tokens.
    // If this test fails, the Authentik version or config has changed to
    // issue JWTs, and the test suite premise is invalid.
    const token = process.env[API_SSO_AUTHENTIK_TOKEN];
    expect(token, 'API_SSO_AUTHENTIK_TOKEN must be set by setup').toBeTruthy();

    const parts = token!.split('.');
    // A JWT always has exactly 3 base64-encoded parts separated by dots.
    // An opaque token does not follow this structure.
    expect(
      parts.length,
      `Expected opaque token but got what looks like a JWT (${parts.length} parts)`,
    ).not.toEqual(3);
  });

  test('opaque access token is rejected by Everest without SSO exchange', async ({request}) => {
    // This is the exact bug from Issue #1904: sending an opaque token
    // directly as Bearer to Everest should fail because echojwt middleware
    // cannot parse it as a JWT.
    const token = process.env[API_SSO_AUTHENTIK_TOKEN];
    expect(token, 'API_SSO_AUTHENTIK_TOKEN must be set by setup').toBeTruthy();

    const resp = await request.get('/v1/version', {
      headers: {
        Authorization: `Bearer ${token!}`,
      },
    });
    // Without the SSO token exchange, opaque tokens get 400 (malformed JWT)
    // or 401 from the JWT middleware.
    expect(
      [400, 401].includes(resp.status()),
      `Expected 400 or 401 but got ${resp.status()} — opaque token should be rejected by JWT middleware`,
    ).toBeTruthy();
  });

  test('SSO token exchange converts opaque token to Everest JWT', async ({request}) => {
    // This tests the fix for Issue #1904: POST /v1/session/sso exchanges
    // the opaque OIDC token for an Everest-signed JWT via the UserInfo endpoint.
    const token = process.env[API_SSO_AUTHENTIK_TOKEN];
    expect(token, 'API_SSO_AUTHENTIK_TOKEN must be set by setup').toBeTruthy();

    const exchangeResp = await request.post('/v1/session/sso', {
      data: {token: token!},
    });
    expect(
      exchangeResp.status(),
      `SSO exchange failed: ${exchangeResp.status()}`,
    ).toEqual(200);

    const body = await exchangeResp.json();
    expect(body.token, 'Exchange response should contain a token').toBeTruthy();

    // The returned token should be a proper JWT (3 parts)
    const jwtParts = body.token.split('.');
    expect(jwtParts.length, 'Exchanged token should be a JWT').toEqual(3);

    // The Everest JWT should be usable for authenticated API calls
    const versionResp = await request.get('/v1/version', {
      headers: {Authorization: `Bearer ${body.token}`},
    });
    expect(versionResp.status()).toEqual(200);
  });

  test('exchanged token can access authenticated endpoints', async ({request}) => {
    const token = process.env[API_SSO_AUTHENTIK_TOKEN];
    expect(token).toBeTruthy();

    // Exchange the opaque token
    const exchangeResp = await request.post('/v1/session/sso', {
      data: {token: token!},
    });
    expect(exchangeResp.status()).toEqual(200);
    const {token: everestToken} = await exchangeResp.json();

    // Access a protected endpoint
    const resp = await request.get('/v1/namespaces', {
      headers: {Authorization: `Bearer ${everestToken}`},
    });
    expect(resp.ok(), `Namespaces request failed: ${resp.status()}`).toBeTruthy();
  });

  test('logout invalidates exchanged session', async ({request}) => {
    const token = process.env[API_SSO_AUTHENTIK_TOKEN];
    expect(token).toBeTruthy();

    // Exchange for Everest JWT
    const exchangeResp = await request.post('/v1/session/sso', {
      data: {token: token!},
    });
    expect(exchangeResp.status()).toEqual(200);
    const {token: everestToken} = await exchangeResp.json();
    const authHeader = {Authorization: `Bearer ${everestToken}`};

    // Verify it works
    const beforeLogout = await request.get('/v1/version', {headers: authHeader});
    expect(beforeLogout.status()).toEqual(200);

    // Logout (blocklist the Everest JWT)
    const logoutResp = await request.delete('/v1/session', {headers: authHeader});
    expect(logoutResp.status()).toEqual(204);

    // Token should now be rejected
    const afterLogout = await request.get('/v1/version', {headers: authHeader});
    expect(afterLogout.status()).toEqual(401);
  });

  test('invalid token exchange is rejected', async ({request}) => {
    const resp = await request.post('/v1/session/sso', {
      data: {token: 'completely-invalid-opaque-token'},
    });
    // The UserInfo call will fail → 401
    expect(resp.status()).toEqual(401);
  });
});

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
import {API_SSO_AUTHENTIK_TOKEN} from '@root/constants';

test.describe('SSO with Authentik', () => {
  test('OIDC settings are configured', async ({request}) => {
    const resp = await request.get('/v1/settings');
    expect(resp.ok()).toBeTruthy();

    const settings = await resp.json();
    expect(settings.oidcConfig).toBeDefined();
    expect(settings.oidcConfig.issuerURL).toContain('/application/o/');
    expect(settings.oidcConfig.clientId).toBeTruthy();
  });

  test('raw OIDC token is not directly usable (must exchange via /session/sso)', async ({request}) => {
    // Authentik may issue JWTs or opaque tokens depending on version/config.
    // Either way, the raw OIDC token should NOT work directly against Everest
    // because it was not signed by Everest. It must first be exchanged via
    // POST /v1/session/sso, which validates the token against the IdP's
    // UserInfo endpoint and returns an Everest-signed JWT.
    const token = process.env[API_SSO_AUTHENTIK_TOKEN];
    expect(token, 'API_SSO_AUTHENTIK_TOKEN must be set by setup').toBeTruthy();

    const resp = await request.get('/v1/version', {
      headers: {
        Authorization: `Bearer ${token!}`,
      },
    });
    // The raw OIDC token is not signed by Everest, so the JWT middleware
    // rejects it with 400 (bad JWT) or 401 (signature mismatch).
    expect(
      [400, 401].includes(resp.status()),
      `Expected 400 or 401 but got ${resp.status()} — raw OIDC token should be rejected`,
    ).toBeTruthy();
  });

  test('SSO token exchange returns Everest JWT', async ({request}) => {
    // POST /v1/session/sso validates the OIDC token via the IdP's UserInfo
    // endpoint and issues an Everest-signed JWT — works for both opaque and
    // JWT OIDC tokens.
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

    // The returned token must be a proper JWT (3 dot-separated parts)
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

    const exchangeResp = await request.post('/v1/session/sso', {
      data: {token: token!},
    });
    expect(exchangeResp.status()).toEqual(200);
    const {token: everestToken} = await exchangeResp.json();

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
      data: {token: 'completely-invalid-token'},
    });
    expect(resp.status()).toEqual(401);
  });
});

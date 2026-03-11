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

import { formSubmitPostProcessing } from '../utils/form-submit-post-processing';

describe('formSubmitPostProcessing', () => {
  it('removes empty optional values recursively before submit payload is sent', () => {
    const input = {
      provider: 'psmdb',
      dbName: 'my-db',
      resources: {
        nodes: undefined,
        cpu: '',
        memory: null,
        disk: 10,
      },
      monitoring: {
        enabled: false,
      },
    } as Record<string, unknown>;

    const result = formSubmitPostProcessing({}, input);

    expect(result).toEqual({
      provider: 'psmdb',
      dbName: 'my-db',
      resources: {
        disk: 10,
      },
      monitoring: {
        enabled: false,
      },
    });
  });
});

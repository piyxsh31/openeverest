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

import { render, screen } from '@testing-library/react';
import { renderComponentChildren } from '../component-renderer';
import { Component, FieldType } from '../../../ui-generator.types';
import { TestWrapper } from 'utils/test';

describe('renderComponentChildren', () => {
  it('returns select options for select component', () => {
    const item: Component = {
      uiType: FieldType.Select,
      path: 'spec.engine',
      fieldParams: {
        label: 'Engine',
        options: [{ label: 'MongoDB', value: 'psmdb' }],
      },
    };

    const children = renderComponentChildren(item, 'spec.engine');

    render(<TestWrapper>{children}</TestWrapper>);

    expect(screen.getByText('MongoDB')).toBeInTheDocument();
  });

  it('returns undefined for components without children', () => {
    const numberItem: Component = {
      uiType: FieldType.Number,
      path: 'spec.replicas',
      fieldParams: { label: 'Replicas' },
    };

    const hiddenItem: Component = {
      uiType: FieldType.Hidden,
      path: 'spec.secret',
      fieldParams: { label: 'Secret' },
    };

    expect(
      renderComponentChildren(numberItem, 'spec.replicas')
    ).toBeUndefined();
    expect(renderComponentChildren(hiddenItem, 'spec.secret')).toBeUndefined();
  });
});

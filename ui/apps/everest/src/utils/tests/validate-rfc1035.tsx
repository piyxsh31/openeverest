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

import React from 'react';
import { fireEvent, render, waitFor, screen } from '@testing-library/react';
import { TestWrapper } from '../test';
import { FormProvider, useForm } from 'react-hook-form';

const FormProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({});

  return <FormProvider {...methods}>{children}</FormProvider>;
};

export const validateInputWithRFC1035 = ({
  renderComponent,
  suiteName,
  errors,
}: {
  renderComponent: () => JSX.Element;
  suiteName: string;
  errors: Record<string, string>;
}) => {
  describe(suiteName, () => {
    const triggerValidation = (el: HTMLElement, submit = true) => {
      fireEvent.blur(el);
      const form = submit ? el.closest('form') : null;
      if (form && submit) {
        fireEvent.submit(form);
      }
    };

    beforeEach(() => {
      render(
        <TestWrapper>
          <FormProviderWrapper>{renderComponent()}</FormProviderWrapper>
        </TestWrapper>
      );
    });

    describe('name input', () => {
      it('should not display error for correct value', async () => {
        const input = screen.getByTestId('text-input-name');
        fireEvent.change(input, {
          target: { value: 'name-input-test-123a' },
        });
        triggerValidation(input, false);

        await waitFor(() =>
          Object.values(errors).forEach((val) => {
            expect(screen.queryByText(val)).not.toBeInTheDocument();
          })
        );
      });

      it('should display error for empty string', async () => {
        const input = screen.getByTestId('text-input-name') as HTMLInputElement;
        fireEvent.change(input, {
          target: { value: '' },
        });
        triggerValidation(input);

        expect(input.value).toBe('');
      });

      it('should display error for a string too long', async () => {
        const nameInput = screen.getByTestId(
          'text-input-name'
        ) as HTMLInputElement;
        fireEvent.change(nameInput, {
          target: {
            value: 'ABCDEFGHIJKLMNOPQRSTUV',
          },
        });
        triggerValidation(nameInput);

        fireEvent.change(nameInput, {
          target: {
            value: 'ABCDEFGHIJKLMNOPQRSTUVWV',
          },
        });
        triggerValidation(nameInput);

        await waitFor(() => {
          expect(nameInput.value).toBe('ABCDEFGHIJKLMNOPQRSTUVWV');
        });
      });

      it('should display error for a string containing anything else than lowercase letters, numbers and hyphens.', async () => {
        const nameInput = screen.getByTestId('text-input-name');
        fireEvent.change(nameInput, {
          target: {
            value: 'test-123',
          },
        });
        triggerValidation(nameInput, false);

        fireEvent.change(nameInput, {
          target: {
            value: 'test@123',
          },
        });
        triggerValidation(nameInput);

        await waitFor(() => {
          expect((nameInput as HTMLInputElement).value).toBe('test@123');
        });
      });

      it('should display error for a string ending with a hyphen', async () => {
        const nameInput = screen.getByTestId('text-input-name');
        fireEvent.change(nameInput, {
          target: {
            value: 'test-123',
          },
        });
        triggerValidation(nameInput, false);

        fireEvent.change(nameInput, {
          target: {
            value: 'test123-',
          },
        });
        triggerValidation(nameInput);

        await waitFor(() => {
          expect((nameInput as HTMLInputElement).value).toBe('test123-');
        });
      });

      it('should display error for a string starting with a hyphen or number', async () => {
        const nameInput = screen.getByTestId('text-input-name');
        fireEvent.change(nameInput, {
          target: {
            value: 'test-123',
          },
        });
        triggerValidation(nameInput, false);

        fireEvent.change(nameInput, {
          target: {
            value: '-test123',
          },
        });
        triggerValidation(nameInput);

        await waitFor(() => {
          expect((nameInput as HTMLInputElement).value).toBe('-test123');
        });

        fireEvent.change(nameInput, {
          target: {
            value: '1test',
          },
        });
        triggerValidation(nameInput);

        await waitFor(() => {
          expect((nameInput as HTMLInputElement).value).toBe('1test');
        });
      });
    });
  });
};

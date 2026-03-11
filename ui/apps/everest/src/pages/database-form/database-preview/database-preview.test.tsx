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

// @ts-nocheck
// TODO remove this file after release of v2

import React from 'react';
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { DbType } from '@percona/types';
import { TestWrapper } from 'utils/test';
import { DatabasePreview } from './database-preview.tsx';
import { DbWizardType } from '../database-form-schema.ts';
import { getDbWizardDefaultValues } from '../utils/get-default-values';

const FormProviderWrapper = ({
  children,
  values = {
    dbType: DbType.Mongo,
  },
}: {
  children: React.ReactNode;
  values?: Partial<DbWizardType>;
}) => {
  const methods = useForm<DbWizardType>({
    defaultValues: { ...getDbWizardDefaultValues(values.dbType!), ...values },
  });

  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
};

describe.skip('DatabasePreview', () => {
  it('should show all sections', () => {
    render(
      <FormProviderWrapper>
        <TestWrapper>
          <DatabasePreview stepsWithErrors={[]} activeStep={0} />
        </TestWrapper>
      </FormProviderWrapper>
    );

    expect(screen.getAllByTestId(/^section-*/, { exact: false })).toHaveLength(
      5
    );
  });

  it('should show values from form', () => {
    render(
      <FormProviderWrapper
        values={{
          dbName: 'myDB',
          dbType: DbType.Mysql,
          dbVersion: '1.0.0',
        }}
      >
        <TestWrapper>
          <DatabasePreview stepsWithErrors={[]} activeStep={0} />
        </TestWrapper>
      </FormProviderWrapper>
    );

    expect(screen.getByText('Name: myDB')).toBeInTheDocument();
    expect(screen.getByText('Type: MySQL')).toBeInTheDocument();
    expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument();

    expect(screen.queryByText('Nº nodes: 1')).not.toBeInTheDocument();
  });

  it('should show values from previous steps', async () => {
    render(
      <FormProviderWrapper
        values={{
          dbName: 'myDB',
          dbType: DbType.Mysql,
          dbVersion: '1.0.0',
          disk: 30,
        }}
      >
        <TestWrapper>
          <DatabasePreview stepsWithErrors={[]} activeStep={1} />
        </TestWrapper>
      </FormProviderWrapper>
    );

    expect(screen.getByText('Name: myDB')).toBeInTheDocument();
    expect(screen.getByText('Type: MySQL')).toBeInTheDocument();
    expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument();

    expect(
      screen.getByText(
        '3 nodes - CPU - 3.00 CPU; Memory - 6.00 GB; Disk - 90.00 Gi'
      )
    ).toBeInTheDocument();
  });

  it('should get updated form values', async () => {
    const FormConsumer = () => {
      const { setValue } = useFormContext();

      return (
        <button
          aria-label="Change DB name"
          type="button"
          data-testid="change-db-name"
          onClick={() => setValue('dbName', 'myNewDB')}
        />
      );
    };

    render(
      <FormProviderWrapper
        values={{
          dbName: 'myDB',
          dbType: DbType.Mysql,
          dbVersion: '1.0.0',
          disk: 30,
        }}
      >
        <TestWrapper>
          <FormConsumer />
          <DatabasePreview stepsWithErrors={[]} activeStep={1} />
        </TestWrapper>
      </FormProviderWrapper>
    );

    expect(screen.getByText('Name: myDB')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('change-db-name'));

    await waitFor(() =>
      expect(screen.getByText('Name: myNewDB')).toBeInTheDocument()
    );

    expect(screen.queryByText('Name: myDB')).not.toBeInTheDocument();
  });
});

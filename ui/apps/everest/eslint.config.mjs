import baseConfig from '@percona/eslint-config-react';

export default [
  {
    ignores: [
      '.e2e/playwright-report/',
      '.e2e/test-results/',
      'playwright-report/',
      'tests-out/',
    ],
  },
  ...baseConfig,
  {
    files: ['.e2e/**/*.ts'],
    rules: {
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      'no-empty-function': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-var': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-empty-pattern': 'warn',
      'no-case-declarations': 'off',
      'no-constant-condition': 'off',
    },
  },
];

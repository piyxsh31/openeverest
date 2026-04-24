import { CI_USER_STORAGE_STATE_FILE } from '@e2e/constants';
import { PlaywrightTestProject } from '@playwright/test';

export const settingsProject: PlaywrightTestProject[] = [
  {
    name: 'pr:settings',
    testMatch: /.^/,
    dependencies: [
      'pr:settings:monitoring-config',
      // 'pr:settings:backup-storage',
      // 'pr:settings:namespace',
      // 'pr:settings:psp',
      // 'pr:settings:operator-upgrade',
    ],
  },
  // {
  //   name: 'pr:settings:backup-storage',
  //   testDir: './pr/settings',
  //   testMatch: /backup-storage\.e2e\.ts/,
  //   dependencies: ['global:auth:ci:setup'],
  //   use: {
  //     storageState: CI_USER_STORAGE_STATE_FILE,
  //   },
  // },
  {
    name: 'pr:settings:monitoring-config',
    testDir: './pr/settings',
    testMatch: /monitoring-config\.e2e\.ts/,
    dependencies: ['global:auth:ci:setup'],
    use: {
      storageState: CI_USER_STORAGE_STATE_FILE,
    },
  },
  // {
  //   name: 'pr:settings:namespace',
  //   testDir: './pr/settings',
  //   testMatch: /namespaces-list\.e2e\.ts/,
  //   dependencies: ['global:auth:ci:setup'],
  //   use: {
  //     storageState: CI_USER_STORAGE_STATE_FILE,
  //   },
  // },
  // {
  //   name: 'pr:settings:psp',
  //   testDir: './pr/settings',
  //   testMatch: /pod-scheduling-policies\.e2e\.ts/,
  //   dependencies: ['global:auth:ci:setup'],
  //   use: {
  //     storageState: CI_USER_STORAGE_STATE_FILE,
  //   },
  // },
  // {
  //   name: 'pr:settings:operator-upgrade',
  //   testDir: './pr/settings',
  //   testMatch: /operator-upgrade\.e2e\.ts/,
  //   dependencies: ['global:auth:ci:setup'],
  //   use: {
  //     storageState: CI_USER_STORAGE_STATE_FILE,
  //   },
  // },
];

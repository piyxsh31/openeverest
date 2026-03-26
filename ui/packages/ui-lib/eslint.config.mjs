import baseConfig from '@percona/eslint-config-react';
import storybook from 'eslint-plugin-storybook';

export default [...baseConfig, ...storybook.configs['flat/recommended']];

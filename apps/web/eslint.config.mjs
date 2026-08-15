import react from '@it-sum/config/eslint/react';

export default [
  ...react,
  {
    ignores: ['.next/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
];

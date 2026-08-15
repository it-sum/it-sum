import globals from 'globals';
import base from './base.mjs';

/**
 * ESLint preset for Node-side workspaces (NestJS API, tooling scripts).
 */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // NestJS relies on decorator metadata and constructor parameter properties.
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/parameter-properties': 'off',

      // Server code must never leak secrets through logs; enforce structured logging.
      'no-restricted-globals': [
        'error',
        {
          name: 'console',
          message: 'Use the injected pino logger so output is structured and redacted.',
        },
      ],
    },
  },
];

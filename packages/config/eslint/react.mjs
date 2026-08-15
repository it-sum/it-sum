import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import base from './base.mjs';

/**
 * ESLint preset for React / Next.js workspaces.
 *
 * Accessibility rules are errors rather than warnings because the plan commits
 * to WCAG AA, and RTL correctness depends on avoiding physical-direction props.
 */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-autofocus': 'warn',

      // Bilingual RTL safety: physical direction utilities break Arabic layout.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXAttribute[name.name='className'][value.value=/\\b(ml-|mr-|pl-|pr-|left-|right-|text-left|text-right|border-l|border-r|rounded-l|rounded-r)/]",
          message:
            'Use logical Tailwind utilities (ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e) so RTL works structurally.',
        },
      ],
    },
  },
];

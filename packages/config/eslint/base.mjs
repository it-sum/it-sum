import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

/**
 * Base flat ESLint config shared by every IT-SUM workspace.
 *
 * Deliberately strict: the plan requires TypeScript strict mode with no `any`
 * escape hatches in reviewed code, so unsafe patterns are errors, not warnings.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/*.generated.ts',
      '**/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Type safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // Correctness
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-implicit-coercion': 'warn',
      'object-shorthand': ['error', 'always'],

      // Import hygiene
      'no-duplicate-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../../*'],
              message:
                'Reach for a workspace package (@it-sum/*) or a path alias instead of deep relative imports.',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
);

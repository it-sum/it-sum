/**
 * Shared Prettier configuration for every IT-SUM workspace.
 * Single source of truth so the two developer tracks cannot diverge on style.
 * @type {import('prettier').Config}
 */
const config = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: { printWidth: 120, proseWrap: 'preserve' },
    },
    {
      files: ['*.json', '*.jsonc'],
      options: { printWidth: 120 },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: { singleQuote: false },
    },
  ],
};

export default config;

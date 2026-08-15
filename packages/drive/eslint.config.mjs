import node from '@it-sum/config/eslint/node';

export default [
  ...node,
  { ignores: ['dist/**', 'node_modules/**'] },
];

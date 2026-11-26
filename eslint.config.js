import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: {
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'max-len': ['error', { code: 120 }],
      'prefer-const': 'error',
    },
  },
];

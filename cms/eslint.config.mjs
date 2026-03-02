import js from '@eslint/js';
import globals from 'globals';
import n from 'eslint-plugin-n';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/', 'uploads/', '.env', 'package-lock.json'],
  },
  js.configs.recommended,
  n.configs['flat/recommended'],
  promisePlugin.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Backend best practices
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-shadow': 'error',
      'no-use-before-define': ['error', { functions: false }],
      'quotes': ['error', 'single'],

      // Import consistency
      'import/order': ['error', { groups: [['builtin', 'external', 'internal']] }],
      'import/no-unresolved': 'off', // Node ESM handles this well, often buggy with flat config

      // Node specific
      'n/no-missing-import': 'off', // Often redundant with modern editors/tooling
      'n/handle-callback-err': ['error', '^(err|error)$'],
      'n/no-process-exit': 'error',
    },
  },
  {
    files: ['src/db/*.js', 'src/server.js', 'eslint.config.mjs'],
    rules: {
      'n/no-process-exit': 'off',
    },
  },
  {
    files: ['src/db/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['eslint.config.mjs'],
    rules: {
      'n/no-unpublished-import': 'off',
    },
  },
  prettierConfig, // Always last to disable conflicting rules
];

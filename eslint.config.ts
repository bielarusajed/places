import js from '@eslint/js';
import eslintPluginAstro from 'eslint-plugin-astro';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['.astro/', 'node_modules/', 'src/components/ui/*.tsx'],
  },
  // Base config for all files
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React-specific configs only for JSX/TSX files
  {
    files: ['**/*.{jsx,tsx}'],
    ...pluginReact.configs.flat.recommended,
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...pluginReact.configs.flat['jsx-runtime'],
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...pluginReactHooks.configs.flat['recommended-latest'],
  },
  {
    files: ['**/*.{jsx,tsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...reactRefresh.configs.vite,
  },

  // Astro-specific config
  ...eslintPluginAstro.configs['flat/jsx-a11y-recommended'],

  // Import sorting (auto-fixable)
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,astro}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'react/no-children-prop': 'off',
    },
  },
];

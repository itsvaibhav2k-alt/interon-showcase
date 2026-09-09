/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
        minimumDescriptionLength: 5,
      },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../../*', '../../../*', '../../../../*'],
            message:
              'Relative imports more than one level up are forbidden. Use workspace aliases (@/db, @/ui, @/types, @/lib/*) instead.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      extends: ['next/core-web-vitals'],
      rules: {
        'react/jsx-no-literals': [
          'error',
          {
            noStrings: true,
            allowedStrings: [':', '/', '-', '·', '•', '—'],
            ignoreProps: true,
          },
        ],
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'import/order': [
          'error',
          {
            groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
            pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
            pathGroupsExcludedImportTypes: ['builtin'],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
        'import/no-anonymous-default-export': 'off',
      },
    },
    {
      files: ['packages/**/*.{ts,tsx}'],
      extends: ['plugin:import/recommended', 'plugin:import/typescript'],
      settings: {
        'import/resolver': {
          typescript: {
            project: ['./packages/*/tsconfig.json'],
          },
          node: true,
        },
      },
      rules: {
        'import/order': [
          'error',
          {
            groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
            pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
            pathGroupsExcludedImportTypes: ['builtin'],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
        'import/no-unresolved': 'off',
        'import/namespace': 'off',
        'import/default': 'off',
        'import/named': 'off',
      },
    },
    {
      files: ['**/*.config.*', '**/*.cjs', '**/*.mjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      rules: {
        'react/jsx-no-literals': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules',
    '.next',
    '.turbo',
    'dist',
    'coverage',
    '*.config.js',
    'next-env.d.ts',
  ],
};

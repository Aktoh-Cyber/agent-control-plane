/**
 * ESLint v9 Flat Configuration
 *
 * Modern ESLint configuration using the flat config format.
 * Includes TypeScript support, environment-aware console rules,
 * and best practices for Node.js and ES2022+ development.
 */

import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Global ignores - files/folders to skip linting
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.min.js',
      '**/coverage/**',
      '**/*.d.ts',
      '**/wasm/**',
      '**/pkg/**',
      '**/*.tgz',
      '**/open-lovable/**',
      '**/.swarm/**',
      '**/test-reports/**',
      '**/test-results/**',

      // The repo has a nested ./agent-control-plane/ subdir (the actual
      // agentic-flow codebase, with its own package.json + tsconfig at
      // agent-control-plane/config/tsconfig.json). The root eslint can't
      // resolve project-service for those files because their tsconfig
      // isn't rooted at our tsconfigRootDir (import.meta.dirname →
      // config/ at the root). Skip them here; the inner package's own
      // `pnpm typecheck` (config/tsconfig.json) is the canonical type
      // gate for that code.
      // Use **/ anchor: when ESLint is invoked with --config config/eslint.config.js,
      // some path resolution treats globs as relative to the config file dir.
      // **/agent-control-plane/** matches the nested subdir regardless of cwd.
      '**/agent-control-plane/**',
    ],
  },

  // Base ESLint recommended rules for all files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      ...eslint.configs.recommended.rules,

      // Console rules - warn in development, error in production
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      // Unused variables - warn but allow underscore prefix for intentionally unused
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Best practices
      'prefer-const': 'warn',
      'no-var': 'error',
      'object-shorthand': ['warn', 'always'],
    },
  },

  // TypeScript-specific configuration
  ...tseslint.config({
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Console rules - environment-aware
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      // Allow require for CommonJS compatibility where needed
      '@typescript-eslint/no-require-imports': 'off',

      // Relaxed rules for flexibility
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Require explicit return types on functions
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Allow empty functions (useful for default implementations)
      '@typescript-eslint/no-empty-function': 'warn',
    },
  }),

  // Test files - relaxed rules
  {
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', '**/tests/**', '**/test/**'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Config files - CommonJS support
  {
    files: ['**/*.config.{js,ts}', '**/.*rc.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];

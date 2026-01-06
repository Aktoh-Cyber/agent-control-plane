/**
 * Lint-Staged Configuration
 *
 * Defines commands to run on staged files before commit.
 * This ensures code quality and formatting standards are maintained.
 */

export default {
  // TypeScript and JavaScript files - format only
  // Note: ESLint disabled for lint-staged due to OOM on large initial commits
  // Run `npm run lint:fix` separately for ESLint
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['prettier --write --config config/prettier.config.js'],

  // JSON, YAML, and Markdown files - just format
  '*.{json,yml,yaml,md}': ['prettier --write --config config/prettier.config.js'],

  // Package files - format only
  'package.json': ['prettier --write --config config/prettier.config.js'],
};

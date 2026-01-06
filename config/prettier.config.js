/**
 * Prettier Configuration
 *
 * Formatting rules for consistent code style across the project.
 * This configuration is used by Prettier to format JavaScript, TypeScript,
 * JSON, Markdown, and other supported file types.
 */

export default {
  // Print width - try to keep lines under 100 characters
  printWidth: 100,

  // Use 2 spaces for indentation
  tabWidth: 2,
  useTabs: false,

  // Use semicolons at the end of statements
  semi: true,

  // Use single quotes instead of double quotes
  singleQuote: true,

  // Quote properties in objects only when necessary
  quoteProps: 'as-needed',

  // Use single quotes in JSX
  jsxSingleQuote: false,

  // Trailing commas in multi-line comma-separated syntactic structures
  // 'es5' = trailing commas where valid in ES5 (objects, arrays, etc.)
  trailingComma: 'es5',

  // Spaces between brackets in object literals
  bracketSpacing: true,

  // Put the > of a multi-line JSX element at the end of the last line
  bracketSameLine: false,

  // Arrow function parentheses - always include parens
  arrowParens: 'always',

  // Format only valid code (don't attempt to format invalid syntax)
  requirePragma: false,
  insertPragma: false,

  // Wrap prose at printWidth
  proseWrap: 'preserve',

  // Respect HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // Line endings - maintain existing line endings
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Single attribute per line in HTML, Vue and JSX
  singleAttributePerLine: false,

  // Plugins for organizing imports
  plugins: ['prettier-plugin-organize-imports'],
};

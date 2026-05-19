import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
    testTimeout: 10000,
  },
  resolve: {
    // The route handlers under test live two levels up. Use absolute paths
    // so the tests stay close to the modules they exercise.
    alias: {
      '@acp/src': resolve(__dirname, '../../src'),
      // better-sqlite3 is a native binding compiled per-Node-ABI. Route
      // tests don't exercise persistence, so alias to a no-op stub.
      // Avoids the ABI mismatch when CI's Node version differs from
      // whatever was used to install the inner ACP's node_modules.
      'better-sqlite3': resolve(__dirname, 'stubs/better-sqlite3.ts'),
    },
  },
});

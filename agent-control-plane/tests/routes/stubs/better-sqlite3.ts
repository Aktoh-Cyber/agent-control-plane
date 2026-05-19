/**
 * Stub for better-sqlite3 used by route-level tests (T-24/T-27).
 *
 * The governance router pulls in usage-tracker.ts which constructs a
 * better-sqlite3 Database at module-load time. The native binding's ABI
 * version differs between Node releases, and CI runners often don't have
 * a binding compiled for the current Node version. Rather than rebuild
 * on every CI run, route tests alias the package to this no-op stub via
 * vitest.config.ts. The actual usage-tracker behaviour isn't exercised
 * by the route-level tests — only its authorization gates.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

const stmt = {
  run: () => ({ changes: 0, lastInsertRowid: 0 }),
  all: () => [],
  get: () => undefined,
  iterate: () => ({
    [Symbol.iterator]: () => ({ next: () => ({ value: undefined, done: true }) }),
  }),
};

class Database {
  prepare(_sql: string) {
    return stmt;
  }
  exec(_sql: string) {
    return undefined;
  }
  pragma(_p: string) {
    return undefined;
  }
  close() {
    return undefined;
  }
  transaction(fn: (...args: any[]) => any) {
    return fn;
  }
}

export default Database;

# tests/routes — ACP Route-Level Integration Suite (T-24 + T-27)

Standalone vitest project that exercises every HTTP route in the ACP express routers (`src/{audit,compliance,federation,governance}`). Closes T-24 and T-27 from `specs/active/Horsemen-Validation-Checklists.md` v2.1.

## Why standalone

The existing ACP test infrastructure has two test runners (a vitest one focused on `src/transport/**` and `src/proxy/**`, and the inner ACP package's `tsx`-driven scripts). Neither has a supertest-style HTTP harness. Standing up a self-contained vitest project under `tests/routes/` keeps:

- the existing coverage thresholds on `src/transport/` / `src/proxy/` intact
- the new dependency surface minimal — vitest only, no supertest (we use node's built-in `http`)
- per-domain folder growth straightforward (each `*.test.ts` mounts one router)

This is **Option B** from `specs/active/T-24-T-27-ACP-route-test-plan.md`, picked after the owner sign-off.

## Files

| File                  | Lines | Routes covered                                | Test count |
| --------------------- | ----- | --------------------------------------------- | ---------- |
| `harness.ts`          | ~170  | n/a (harness only)                            | n/a        |
| `compliance.test.ts`  | ~330  | 9 GDPR + residency routes                     | 31         |
| `audit.test.ts`       | ~190  | 7 audit routes                                | 20         |
| `federation.test.ts`  | ~230  | 14 orgs/teams/members/quotas routes           | 30         |
| `role-routes.test.ts` | ~130  | 5 role + permissions routes                   | 12         |
| `governance.test.ts`  | ~190  | 10 policy/budget/usage/routing/litellm routes | 21         |

**Total: 45 routes, 114 tests.**

## Harness

`harness.ts` provides:

- `mountRouter(router, prefix)` — stands up an Express app with the router mounted at `prefix`, listens on an ephemeral port, returns a `TestServer` with `get/post/put/patch/delete` shortcuts.
- `TestIdentity` — the identity object every ACP router reads from `req.identity`. We inject it through a synthetic `x-test-identity` header so each test can configure its caller without spinning up real auth.
- `identities` — preset roles for the most common test scenarios (`anonymous`, `orgAnalyst`, `orgAdmin`, `superAdmin`, `otherOrgAdmin`).

## What each test file covers

Every route is checked for the following invariants:

1. **401** when no identity is attached.
2. **403** where the route requires admin (or super-admin).
3. **Happy path** (200 / 201) for the appropriate identity.
4. **Cross-org isolation** on read endpoints — a request from org-2 must not see org-1's data.
5. **Body validation** (400) on the highest-risk inputs (deletion scope, retention days).

Body-validation completeness for every edge case is deliberately deferred to a follow-up — the audit's primary concern was "is this surface guarded at all?", and these 114 tests prove it is.

## Notable workarounds

- **`better-sqlite3` ABI mismatch**: the governance router pulls in `usage-tracker.ts` which constructs a SQLite database at module-load time. The native binding is built against a specific Node ABI version that doesn't always match the local Node. `governance.test.ts` mocks `better-sqlite3` with a no-op stub so the router can load. A follow-up could replace the stub with `@vitest/spy`-driven fixtures, but for route-level auth coverage the stub is sufficient.

- **In-memory stores don't persist between routers**: `organizationStore`, `deletionService`, `dataResidencyStore`, etc. are module-level singletons. Tests that mutate state use unique orgIds, and the deletion suite calls `deletionService.clear()` in `beforeEach`. Federation's `organizationStore` doesn't expose a `clear()` method — tests that need org existence call POST first and inspect its response.

- **`/quotas/limits` returns 404 by default**: federation's quota handler 404s when the caller's org isn't in `organizationStore`. The test accepts both `200` and `404` because both prove the auth gate ran — the distinction is store state, not authorisation.

## Running

```bash
cd tests/routes
npm install             # one-time: installs vitest + @types/node + typescript
npx vitest run          # or `npm test`
```

CI integration is the obvious follow-up: add a `pnpm test:routes` script to the inner ACP `package.json` that runs `(cd tests/routes && npm install && npx vitest run)`, then call it from the project-level workflow alongside the existing `test:main`.

## Closes

- T-24 (9 compliance routes) — `specs/active/Horsemen-Validation-Checklists.md` v2.1
- T-27 (36 audit + federation + role + governance routes) — same checklist
- G-66 → G-72 from `specs/active/Horsemen-Deep-Review-Gap-Analysis.md` v3.0 Category 11

Plan that drove this: `specs/active/T-24-T-27-ACP-route-test-plan.md` (Option B).

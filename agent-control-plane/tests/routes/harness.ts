/**
 * Test harness for ACP route-level integration tests (T-24 + T-27).
 *
 * Stands up a real Express app + the router under test, then exposes a
 * tiny supertest-style request helper that uses node's built-in http
 * client. We deliberately don't depend on the `supertest` npm package
 * — it's not installed in the inner ACP node_modules and the deferral
 * plan called out keeping the dep surface tight.
 *
 * Identity injection: every ACP router reads `(req as any).identity =
 * { sub, orgId, roles }`. The middleware that sets this in production
 * lives outside the router. For tests we wire a small middleware that
 * pulls a synthetic identity from a request header, so every test can
 * configure its caller in one place without spinning up real auth.
 *
 * Closes T-24 + T-27 (Option B harness).
 */
import express, { type Application, type RequestHandler, type Router } from 'express';
import http from 'http';
import type { AddressInfo } from 'net';

export interface TestIdentity {
  sub: string;
  orgId: string;
  roles: string[];
}

/**
 * Mount a router and return an HTTP client bound to its ephemeral port.
 *
 * @param router  the express Router under test
 * @param prefix  the path prefix to mount it at (e.g. '/api/compliance')
 */
export function mountRouter(router: Router, prefix: string): Promise<TestServer> {
  return new Promise((resolve, reject) => {
    const app: Application = express();
    app.use(express.json());
    // Synthetic identity middleware — pulls from x-test-identity header.
    const identityMw: RequestHandler = (req, _res, next) => {
      const raw = req.header('x-test-identity');
      if (raw) {
        try {
          (req as any).identity = JSON.parse(raw);
        } catch {
          // ignore malformed; leave req.identity unset → handler returns 401
        }
      }
      next();
    };
    app.use(identityMw);
    app.use(prefix, router);

    const server = http.createServer(app);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      resolve(new TestServer(server, `http://127.0.0.1:${addr.port}`, prefix));
    });
  });
}

interface RequestOpts {
  identity?: TestIdentity;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface TestResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

export class TestServer {
  constructor(
    private readonly server: http.Server,
    private readonly baseUrl: string,
    private readonly prefix: string
  ) {}

  close(): Promise<void> {
    return new Promise((resolve) => this.server.close(() => resolve()));
  }

  /** Returns the full URL for a path mounted under the router's prefix. */
  url(path: string): string {
    return `${this.baseUrl}${this.prefix}${path}`;
  }

  request(method: string, path: string, opts: RequestOpts = {}): Promise<TestResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.url(path));
      const bodyStr = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        ...(opts.headers ?? {}),
      };
      if (opts.identity) headers['x-test-identity'] = JSON.stringify(opts.identity);
      if (bodyStr !== undefined) headers['content-length'] = String(Buffer.byteLength(bodyStr));

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method,
          headers,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let parsed: any = data;
            const ct = res.headers['content-type'] ?? '';
            if (ct.includes('application/json') && data.length > 0) {
              try {
                parsed = JSON.parse(data);
              } catch {
                /* keep raw */
              }
            }
            resolve({
              status: res.statusCode ?? 0,
              body: parsed,
              // Coerce header values to strings; deliberately ignore array
              // duplicates which ACP routers don't emit.
              headers: Object.fromEntries(
                Object.entries(res.headers).map(([k, v]) => [
                  k,
                  String(Array.isArray(v) ? v[0] : v),
                ])
              ),
            });
          });
        }
      );
      req.on('error', reject);
      if (bodyStr !== undefined) req.write(bodyStr);
      req.end();
    });
  }

  // Method-specific shortcuts to match supertest's ergonomic feel.
  get(path: string, opts?: RequestOpts) {
    return this.request('GET', path, opts);
  }
  post(path: string, opts?: RequestOpts) {
    return this.request('POST', path, opts);
  }
  put(path: string, opts?: RequestOpts) {
    return this.request('PUT', path, opts);
  }
  patch(path: string, opts?: RequestOpts) {
    return this.request('PATCH', path, opts);
  }
  delete(path: string, opts?: RequestOpts) {
    return this.request('DELETE', path, opts);
  }
}

/**
 * Common test identities — used across the route suites to keep
 * "caller A in org-1 is not a member" etc. consistent and obvious.
 */
export const identities = {
  anonymous: undefined as TestIdentity | undefined,
  orgAnalyst: {
    sub: 'user-org1-analyst',
    orgId: 'org-1',
    roles: ['analyst'],
  } as TestIdentity,
  orgAdmin: {
    sub: 'user-org1-admin',
    orgId: 'org-1',
    roles: ['org-admin'],
  } as TestIdentity,
  superAdmin: {
    sub: 'user-super',
    orgId: 'org-1',
    roles: ['super-admin'],
  } as TestIdentity,
  otherOrgAdmin: {
    sub: 'user-org2-admin',
    orgId: 'org-2',
    roles: ['org-admin'],
  } as TestIdentity,
};

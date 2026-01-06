/**
 * Mock API Client
 * Mock HTTP client for testing API interactions
 */

export interface MockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}

export interface MockRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: Date;
}

export class MockAPIClient {
  private requests: MockRequest[] = [];
  private responses: Map<string, MockResponse> = new Map();
  private defaultResponse: MockResponse = {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    data: { success: true },
  };

  /**
   * Mock GET request
   */
  async get(url: string, headers?: Record<string, string>): Promise<MockResponse> {
    const request: MockRequest = {
      method: 'GET',
      url,
      headers,
      timestamp: new Date(),
    };

    this.requests.push(request);
    return this.getResponse(`GET:${url}`);
  }

  /**
   * Mock POST request
   */
  async post(url: string, body?: any, headers?: Record<string, string>): Promise<MockResponse> {
    const request: MockRequest = {
      method: 'POST',
      url,
      body,
      headers,
      timestamp: new Date(),
    };

    this.requests.push(request);
    return this.getResponse(`POST:${url}`);
  }

  /**
   * Mock PUT request
   */
  async put(url: string, body?: any, headers?: Record<string, string>): Promise<MockResponse> {
    const request: MockRequest = {
      method: 'PUT',
      url,
      body,
      headers,
      timestamp: new Date(),
    };

    this.requests.push(request);
    return this.getResponse(`PUT:${url}`);
  }

  /**
   * Mock DELETE request
   */
  async delete(url: string, headers?: Record<string, string>): Promise<MockResponse> {
    const request: MockRequest = {
      method: 'DELETE',
      url,
      headers,
      timestamp: new Date(),
    };

    this.requests.push(request);
    return this.getResponse(`DELETE:${url}`);
  }

  /**
   * Mock PATCH request
   */
  async patch(url: string, body?: any, headers?: Record<string, string>): Promise<MockResponse> {
    const request: MockRequest = {
      method: 'PATCH',
      url,
      body,
      headers,
      timestamp: new Date(),
    };

    this.requests.push(request);
    return this.getResponse(`PATCH:${url}`);
  }

  /**
   * Set mock response for specific endpoint
   */
  mockResponse(method: string, url: string, response: Partial<MockResponse>): void {
    const key = `${method}:${url}`;
    this.responses.set(key, {
      ...this.defaultResponse,
      ...response,
    });
  }

  /**
   * Set default response
   */
  setDefaultResponse(response: Partial<MockResponse>): void {
    this.defaultResponse = {
      ...this.defaultResponse,
      ...response,
    };
  }

  /**
   * Get response for request
   */
  private getResponse(key: string): MockResponse {
    return this.responses.get(key) || this.defaultResponse;
  }

  /**
   * Get request history
   */
  getRequests(): MockRequest[] {
    return [...this.requests];
  }

  /**
   * Get last request
   */
  getLastRequest(): MockRequest | null {
    return this.requests[this.requests.length - 1] || null;
  }

  /**
   * Find requests by method
   */
  getRequestsByMethod(method: string): MockRequest[] {
    return this.requests.filter((req) => req.method === method);
  }

  /**
   * Find requests by URL pattern
   */
  getRequestsByUrl(pattern: string | RegExp): MockRequest[] {
    if (typeof pattern === 'string') {
      return this.requests.filter((req) => req.url.includes(pattern));
    }
    return this.requests.filter((req) => pattern.test(req.url));
  }

  /**
   * Clear request history
   */
  clearRequests(): void {
    this.requests = [];
  }

  /**
   * Clear mock responses
   */
  clearResponses(): void {
    this.responses.clear();
  }

  /**
   * Reset client
   */
  reset(): void {
    this.requests = [];
    this.responses.clear();
    this.defaultResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { success: true },
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalRequests: this.requests.length,
      mockResponses: this.responses.size,
      requestsByMethod: {
        GET: this.getRequestsByMethod('GET').length,
        POST: this.getRequestsByMethod('POST').length,
        PUT: this.getRequestsByMethod('PUT').length,
        DELETE: this.getRequestsByMethod('DELETE').length,
        PATCH: this.getRequestsByMethod('PATCH').length,
      },
    };
  }
}

/**
 * Factory function for creating a mock API client
 */
export function createMockAPIClient(): MockAPIClient {
  return new MockAPIClient();
}
